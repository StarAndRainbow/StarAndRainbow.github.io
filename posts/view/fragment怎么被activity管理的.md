fragment 碎片，能做到复用效果

需要依托于activity使用

日常使用

```java
getSupportFragmentManager().beginTransaction().add(R.id.fragment_container,new TrendFragment()).commit();
```

一句话就可以完成使用，那么这个句话是什么含义呢，需要知道activity来管理fragment的

而这里的fragment是使用new出来的，所以fragment就只是一个对象，并且android给我们提供的是一个模版，我们只要实现对应的方法，给这个框架调用就行了，

add的意思看起来就是把fragment中的view add到这个布局里面这么简单，下面来看看

# getSupportFragmentManager()

```java
-class FragmentActivity


   @NonNull
    public FragmentManager getSupportFragmentManager() {
    //mFragments是数组？
        return mFragments.getSupportFragmentManager();
    }

//mFragments是FragmentController
final FragmentController mFragments = FragmentController.createController(new HostCallbacks());
[FragmentController.getSupportFragmentManager]


-class FragmentController
  @NonNull
    public FragmentManager getSupportFragmentManager() {
    //mHost是啥
        return mHost.mFragmentManager;
    }

 //mHost是FragmentHostCallback<?>，这里实则持有的是HostCallbacks
    private final FragmentHostCallback<?> mHost;

在FragmentController构造方法中传入，实则就是上面的new HostCallbacks()

-class FragmentHostCallback<E>
final FragmentManager mFragmentManager = new FragmentManagerImpl();
```

**总结：getSupportFragmentManager()拿到的是FragmentManagerImpl()**

# beginTransaction()

```java
getSupportFragmentManager().beginTransaction()
实则是FragmentManager.beginTransaction()

-class FragmentManager

    @NonNull
    public FragmentTransaction beginTransaction() {
        return new BackStackRecord(this);
    }
```

**总结：getSupportFragmentManager().beginTransaction()这一串方法的调用实则是BackStackRecord()**

# add

```java
BackStackRecord.add这个方法做了啥
-BackStackRecord extends FragmentTransaction{}

那么这个add
-class FragmentTransaction
    @NonNull
    public FragmentTransaction add(@IdRes int containerViewId, @NonNull Fragment fragment) {
        doAddOp(containerViewId, fragment, null, OP_ADD);
        return this;
    }




 void doAddOp(int containerViewId, Fragment fragment, @Nullable String tag, int opcmd) {
        final Class<?> fragmentClass = fragment.getClass();
        final int modifiers = fragmentClass.getModifiers();
        if (fragmentClass.isAnonymousClass() || !Modifier.isPublic(modifiers)
                || (fragmentClass.isMemberClass() && !Modifier.isStatic(modifiers))) {
            throw new IllegalStateException("Fragment " + fragmentClass.getCanonicalName()
                    + " must be a public static class to be  properly recreated from"
                    + " instance state.");
        }

        if (tag != null) {
            if (fragment.mTag != null && !tag.equals(fragment.mTag)) {
                throw new IllegalStateException("Can't change tag of fragment "
                        + fragment + ": was " + fragment.mTag
                        + " now " + tag);
            }
            fragment.mTag = tag;
        }

        if (containerViewId != 0) {
            if (containerViewId == View.NO_ID) {
                throw new IllegalArgumentException("Can't add fragment "
                        + fragment + " with tag " + tag + " to container view with no id");
            }
            if (fragment.mFragmentId != 0 && fragment.mFragmentId != containerViewId) {
                throw new IllegalStateException("Can't change container ID of fragment "
                        + fragment + ": was " + fragment.mFragmentId
                        + " now " + containerViewId);
            }
            fragment.mContainerId = fragment.mFragmentId = containerViewId;
        }

        addOp(new Op(opcmd, fragment));
    }    




    void addOp(Op op) {
        mOps.add(op);
        op.mEnterAnim = mEnterAnim;
        op.mExitAnim = mExitAnim;
        op.mPopEnterAnim = mPopEnterAnim;
        op.mPopExitAnim = mPopExitAnim;
    }
```

**总结：做了一系列操作，最后 mOps.add(op);**

那么需要知道mOps是啥了，并且op是啥

```java
//mOps是一个数组
    ArrayList<Op> mOps = new ArrayList<>();

//op是一个对象
 static final class Op {
        int mCmd;
        Fragment mFragment;
        int mEnterAnim;
        int mExitAnim;
        int mPopEnterAnim;
        int mPopExitAnim;
        Lifecycle.State mOldMaxState;
        Lifecycle.State mCurrentMaxState;

        Op() {
        }

        Op(int cmd, Fragment fragment) {
            this.mCmd = cmd;
            this.mFragment = fragment;
            this.mOldMaxState = Lifecycle.State.RESUMED;
            this.mCurrentMaxState = Lifecycle.State.RESUMED;
        }

        Op(int cmd, @NonNull Fragment fragment, Lifecycle.State state) {
            this.mCmd = cmd;
            this.mFragment = fragment;
            this.mOldMaxState = fragment.mMaxState;
            this.mCurrentMaxState = state;
        }
    }
```

# commit()

```java
    -class BackStackRecord

    -class BackStackRecord extends FragmentTransaction implements
        FragmentManager.BackStackEntry, FragmentManager.OpGenerator{}

    @Override
    public int commit() {
        return commitInternal(false);
    }


    int commitInternal(boolean allowStateLoss) {
        if (mCommittBackStckRecorded) throw new IllegalStateException("commit already called");
        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "Commit: " + this);
            LogWriter logw = new LogWriter(TAG);
            PrintWriter pw = new PrintWriter(logw);
            dump("  ", pw);
            pw.close();
        }
        mCommitted = true;
        if (mAddToBackStack) {
            mIndex = mManager.allocBackStackIndex();
        } else {
            mIndex = -1;
        }

        //这里进行入队列
        mManager.enqueueAction(this, allowStateLoss);
        return mIndex;
    }







    void enqueueAction(@NonNull OpGenerator action, boolean allowStateLoss) {
        if (!allowStateLoss) {
            if (mHost == null) {
                if (mDestroyed) {
                    throw new IllegalStateException("FragmentManager has been destroyed");
                } else {
                    throw new IllegalStateException("FragmentManager has not been attached to a "
                            + "host.");
                }
            }
            checkStateLoss();
        }
        synchronized (mPendingActions) {
            if (mHost == null) {
                if (allowStateLoss) {
                    // This FragmentManager isn't attached, so drop the entire transaction.
                    return;
                }
                throw new IllegalStateException("Activity has been destroyed");
            }
            mPendingActions.add(action);
            scheduleCommit();
        }
    }


   private void checkStateLoss() {
        if (isStateSaved()) {
            throw new IllegalStateException(
                    "Can not perform this action after onSaveInstanceState");
        }
    }


  public boolean isStateSaved() {
        // See saveAllState() for the explanation of this.  We do this for
        // all platform versions, to keep our behavior more consistent between
        // them.
        return mStateSaved || mStopped;
    } 


    //OpGenerator是啥

    //mPendingActions是啥


    //最后： scheduleCommit();
```

## OpGenerator

```java
    interface OpGenerator {

        boolean generateOps(@NonNull ArrayList<BackStackRecord> records,
                @NonNull ArrayList<Boolean> isRecordPop);
    }


     -class BackStackRecord

    -class BackStackRecord extends FragmentTransaction implements
        FragmentManager.BackStackEntry, FragmentManager.OpGenerator{}
     //实则实现，是各种数组操作，先不管
        @Override
    public boolean generateOps(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isRecordPop) {
        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "Run: " + this);
        }

        records.add(this);
        isRecordPop.add(false);
        if (mAddToBackStack) {
            mManager.addBackStackState(this);
        }
        return true;
    }



        private final ArrayList<OpGenerator> mPendingActions = new ArrayList<>();

    -class FragmentManager

      void scheduleCommit() {
        synchronized (mPendingActions) {
            boolean postponeReady =
                    mPostponedTransactions != null && !mPostponedTransactions.isEmpty();
            boolean pendingReady = mPendingActions.size() == 1;
            if (postponeReady || pendingReady) {
                mHost.getHandler().removeCallbacks(mExecCommit);
                mHost.getHandler().post(mExecCommit);
                updateOnBackPressedCallbackEnabled();
            }
        }
    }


        private void updateOnBackPressedCallbackEnabled() {
        // Always enable the callback if we have pending actions
        // as we don't know if they'll change the back stack entry count.
        // See handleOnBackPressed() for more explanation
        synchronized (mPendingActions) {
            if (!mPendingActions.isEmpty()) {
                mOnBackPressedCallback.setEnabled(true);
                return;
            }
        }
        // This FragmentManager needs to have a back stack for this to be enabled
        // And the parent fragment, if it exists, needs to be the primary navigation
        // fragment.
        mOnBackPressedCallback.setEnabled(getBackStackEntryCount() > 0
                && isPrimaryNavigation(mParent));
    }




    private Runnable mExecCommit = new Runnable() {
        @Override
        public void run() {
            execPendingActions(true);
        }
    };



      boolean execPendingActions(boolean allowStateLoss) {
        ensureExecReady(allowStateLoss);

        boolean didSomething = false;
        while (generateOpsForPendingActions(mTmpRecords, mTmpIsPop)) {
            mExecutingActions = true;
            try {
                removeRedundantOperationsAndExecute(mTmpRecords, mTmpIsPop);
            } finally {
                cleanupExec();
            }
            didSomething = true;
        }

        updateOnBackPressedCallbackEnabled();
        doPendingDeferredStart();
        mFragmentStore.burpActive();

        return didSomething;
    }
```

总结：看不出什么东西，就知道是使用handler 切换到主线程，

然后generateOpsForPendingActions(mTmpRecords, mTmpIsPop)

再removeRedundantOperationsAndExecute(mTmpRecords, mTmpIsPop);

再updateOnBackPressedCallbackEnabled();  
doPendingDeferredStart();  
mFragmentStore.burpActive();

首先得知道mTmpRecords, mTmpIsPop，然后再看函数里面做了什么东西，

这两个都是数组

```java
   private ArrayList<BackStackRecord> mTmpRecords;
    private ArrayList<Boolean> mTmpIsPop;
```

那么这两个集合在哪里进行初始化呢？

```java
 private void ensureExecReady(boolean allowStateLoss) {
        if (mExecutingActions) {
            throw new IllegalStateException("FragmentManager is already executing transactions");
        }

        if (mHost == null) {
            if (mDestroyed) {
                throw new IllegalStateException("FragmentManager has been destroyed");
            } else {
                throw new IllegalStateException("FragmentManager has not been attached to a host.");
            }
        }

        if (Looper.myLooper() != mHost.getHandler().getLooper()) {
            throw new IllegalStateException("Must be called from main thread of fragment host");
        }

        if (!allowStateLoss) {
            checkStateLoss();
        }
         //这里进行初始化
        if (mTmpRecords == null) {
            mTmpRecords = new ArrayList<>();
            mTmpIsPop = new ArrayList<>();
        }
        mExecutingActions = true;
        try {
            executePostponedTransaction(null, null);
        } finally {
            mExecutingActions = false;
        }
    }
```

## generateOpsForPendingActions(mTmpRecords, mTmpIsPop)

```java
 private boolean generateOpsForPendingActions(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isPop) {
        boolean didSomething = false;
        synchronized (mPendingActions) {
            if (mPendingActions.isEmpty()) {
                return false;
            }

            final int numActions = mPendingActions.size();
            for (int i = 0; i < numActions; i++) {
                didSomething |= mPendingActions.get(i).generateOps(records, isPop);
            }
            mPendingActions.clear();
            mHost.getHandler().removeCallbacks(mExecCommit);
        }
        return didSomething;
    }
```

首先需要知道mPendingActions是什么东西，记得之前看到过，可以看回上面的额enqueueAction就对mPendingActions做了add操作，

```java
        mPendingActions.add(action);
```

其中action是参数，再往上看一层

```java
 -class BackStackRecord

   int commitInternal(boolean allowStateLoss) {
        if (mCommitted) throw new IllegalStateException("commit already called");
        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "Commit: " + this);
            LogWriter logw = new LogWriter(TAG);
            PrintWriter pw = new PrintWriter(logw);
            dump("  ", pw);
            pw.close();
        }
        mCommitted = true;
        if (mAddToBackStack) {
            mIndex = mManager.allocBackStackIndex();
        } else {
            mIndex = -1;
        }
        mManager.enqueueAction(this, allowStateLoss);
        return mIndex;
    }
```

所以这里的this就是BackStackRecord，这个BackStackRecord之前做过什么操作呢，之前做了add的操作，并且把op保存到数组中，而它也实现了OpGenerator的接口

只有一个方法需要实现

```java
  @Override
    public boolean generateOps(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isRecordPop) {
        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "Run: " + this);
        }

        records.add(this);
        isRecordPop.add(false);
        if (mAddToBackStack) {
            mManager.addBackStackState(this);
        }
        return true;
    }
```

**总结：mPendingActions是一个空数组，OpGenerator实则是事务实现了的一个接口，事务实则是维护了一个数组，里面做平时我们做的，add操作实则是给这个数组添加一个封装好的op对象，mPendingActions添加的就是事务对象，只是这里add是更具体的OpGenerator类型的，而对于OpGenerator真正做事的generateOps，而这个函数做的实则就是使用参数的两个数组进行add操作**

```java
ArrayList<OpGenerator> mPendingActions = new ArrayList<>()
```

  那么这里继续往下看

回到使用handler切换到主线程的操作

```java
-class FragmentManager


   boolean execPendingActions(boolean allowStateLoss) {
        ensureExecReady(allowStateLoss);

        boolean didSomething = false;
        //mTmpRecords和mTmpIsPop到这里都是空数组
        while (generateOpsForPendingActions(mTmpRecords, mTmpIsPop)) {
            mExecutingActions = true;
            try {
                removeRedundantOperationsAndExecute(mTmpRecords, mTmpIsPop);
            } finally {
                cleanupExec();
            }
            didSomething = true;
        }

        updateOnBackPressedCallbackEnabled();
        doPendingDeferredStart();
        mFragmentStore.burpActive();

        return didSomething;
    }
```

## generateOpsForPendingActions

```java
    private boolean generateOpsForPendingActions(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isPop) {
        boolean didSomething = false;
        synchronized (mPendingActions) {
            if (mPendingActions.isEmpty()) {
                return false;
            }

            final int numActions = mPendingActions.size();
            for (int i = 0; i < numActions; i++) {
                didSomething |= mPendingActions.get(i).generateOps(records, isPop);
            }
            mPendingActions.clear();
            mHost.getHandler().removeCallbacks(mExecCommit);
        }
        return didSomething;
    }
```

进入搞了个变量didSomething为false，然后锁上mPendingActions，如果为空，直接返回false，然后遍历mPendingActions数组，经过之前知道mPendingActions只是add一次，然后调用了generateOps【这个函数之前解析过】

传入两个空的数组，循环调用使用|判断，那么只要有一个返回true，都为true

```java
-class BackStackRecord


  @Override
    public boolean generateOps(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isRecordPop) {
        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "Run: " + this);
        }

        records.add(this);
        isRecordPop.add(false);
        if (mAddToBackStack) {
            mManager.addBackStackState(this);
        }
        return true;
    }
```

那么这里实则就是把BackStackRecord添加到数组，并且isRecordPop添加一个false

## removeRedundantOperationsAndExecute(mTmpRecords, mTmpIsPop)

```java
-class FragmentManager

private void removeRedundantOperationsAndExecute(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isRecordPop) {
        if (records.isEmpty()) {
            return;
        }

        if (records.size() != isRecordPop.size()) {
            throw new IllegalStateException("Internal error with the back stack records");
        }
//调用executePostponedTransaction来处理被推迟的事务。
//当用户触发一个包含共享元素动画的 Fragment 替换事务（事务A），系统会将其加入 mPostponedTransactions 队列。若在动画准备期间又提交了另一个替换同一容器的事务（事务B），executePostponedTransaction 会检测到事务A与事务B的交互关系，强制取消事务A以保证界面状态的正确性
        executePostponedTransaction(records, isRecordPop);

        final int numRecords = records.size();
        int startIndex = 0;
        for (int recordNum = 0; recordNum < numRecords; recordNum++) {
//遍历每个记录，检查是否允许重新排序mReorderingAllowed
            final boolean canReorder = records.get(recordNum).mReorderingAllowed;
            if (!canReorder) { //canReorder true允许合并， false不允许合并
//如果不允许重新排序，则分批次执行事务
                // execute all previous transactions
                if (startIndex != recordNum) {
                    executeOpsTogether(records, isRecordPop, startIndex, recordNum);
                }
                // execute all pop operations that don't allow reordering together or
                // one add operation
                int reorderingEnd = recordNum + 1;
                if (isRecordPop.get(recordNum)) {
                    while (reorderingEnd < numRecords
                            && isRecordPop.get(reorderingEnd)
                            && !records.get(reorderingEnd).mReorderingAllowed) {
                        reorderingEnd++;
                    }
                }
                executeOpsTogether(records, isRecordPop, recordNum, reorderingEnd);
                startIndex = reorderingEnd;
                recordNum = reorderingEnd - 1;
            }
        }
//最后处理剩余的事务
        if (startIndex != numRecords) {
//executeOpsTogether将多个事务合并执行，这样可以批量处理，提高效率
            executeOpsTogether(records, isRecordPop, startIndex, numRecords);
        }
    }
```

通过函数名称暗示是移除冗余并且执行，这里主要分析executeOpsTogether这个函数

```java
-class FragmentManager

//​遍历 mPostponedTransactions 列表​
//该方法会遍历所有因等待转场动画而延迟的 StartEnterTransitionListener 对象（每个对象对应一个被推迟的事务）
private void executePostponedTransaction(@Nullable ArrayList<BackStackRecord> records,
            @Nullable ArrayList<Boolean> isRecordPop) {
        int numPostponed = mPostponedTransactions == null ? 0 : mPostponedTransactions.size();
        for (int i = 0; i < numPostponed; i++) {
            StartEnterTransitionListener listener = mPostponedTransactions.get(i);
            if (records != null && !listener.mIsBack) {
                int index = records.indexOf(listener.mRecord);
                if (index != -1 && isRecordPop != null && isRecordPop.get(index)) {
                    mPostponedTransactions.remove(i);
                    i--;
                    numPostponed--;
                    //取消该事务，避免因操作冲突导致界面状态错误
                    //丢弃事务并恢复 Fragment 的初始状态
                    listener.cancelTransaction();
                    continue;
                }
            }
            //listener.isReady()转场动画已准备就绪（例如共享元素动画已完成坐标计算）
            //listener.mRecord.interactsWith(records, 0, records.size())当前事务队列与延迟事务存在视图或 Fragment 的交互（如涉及同一容器或 Fragment 的替换）
            if (listener.isReady() || (records != null
                    && listener.mRecord.interactsWith(records, 0, records.size()))) {
                mPostponedTransactions.remove(i);
                i--;
                numPostponed--;
                int index;
                if (records != null && !listener.mIsBack
                        && (index = records.indexOf(listener.mRecord)) != -1
                        && isRecordPop != null
                        && isRecordPop.get(index)) {
                    // This is popping a postponed transaction
                    //取消该事务，避免因操作冲突导致界面状态错误
                    //丢弃事务并恢复 Fragment 的初始状态
                    listener.cancelTransaction();
                } else {
                    //执行延迟事务并触发转场动画
                    listener.completeTransaction();
                }
            }
        }
    }

//mPostponedTransactions的类型
private ArrayList<StartEnterTransitionListener> mPostponedTransactions;

 static class StartEnterTransitionListener
            implements Fragment.OnStartEnterTransitionListener {
        final boolean mIsBack;
        final BackStackRecord mRecord;
        private int mNumPostponed;

        StartEnterTransitionListener(@NonNull BackStackRecord record, boolean isBack) {
            mIsBack = isBack;
            mRecord = record;
        }
}
```

小结：主要处理延迟事务和当前事务的冲突处理

## executeOpsTogether

```java
private void executeOpsTogether(@NonNull ArrayList<BackStackRecord> records,
            @NonNull ArrayList<Boolean> isRecordPop, int startIndex, int endIndex) {
//确定是否允许操作重排序（allowReordering）
        final boolean allowReordering = records.get(startIndex).mReorderingAllowed;
        boolean addToBackStack = false;
//初始化临时列表 mTmpAddedFragments，用于缓存当前所有已添加的 Fragment，以跟踪事务对 Fragment 状态的影响。
        if (mTmpAddedFragments == null) {
            mTmpAddedFragments = new ArrayList<>();
        } else {
            mTmpAddedFragments.clear();
        }
        mTmpAddedFragments.addAll(mFragmentStore.getFragments());
//获取当前的主导航 Fragment（oldPrimaryNav），用于处理导航相关的事务（如 setPrimaryNavigationFragment
        Fragment oldPrimaryNav = getPrimaryNavigationFragment();

//​ 遍历事务并扩展操作
        for (int recordNum = startIndex; recordNum < endIndex; recordNum++) {
            final BackStackRecord record = records.get(recordNum);
            final boolean isPop = isRecordPop.get(recordNum);
            if (!isPop) {
//正向操作（非 Pop）,调用 expandOps() 扩展事务操作（如 ADD/REPLACE），更新 mTmpAddedFragments 列表，并调整主导航 Fragment
                oldPrimaryNav = record.expandOps(mTmpAddedFragments, oldPrimaryNav);
            } else {
//反向操作 调用 trackAddedFragmentsInPop() 跟踪回退操作中新增的 Fragment（如因 Pop 导致其他 Fragment 重新显示）
                oldPrimaryNav = record.trackAddedFragmentsInPop(mTmpAddedFragments, oldPrimaryNav);
            }
            addToBackStack = addToBackStack || record.mAddToBackStack;
        }

//释放资源
        mTmpAddedFragments.clear();
//状态激活与过渡处理
        if (!allowReordering && mCurState >= Fragment.CREATED) {
            if (USE_STATE_MANAGER) {
                // When reordering isn't allowed, we may be operating on Fragments that haven't
                // been made active
                for (int index = startIndex; index < endIndex; index++) {
                    BackStackRecord record = records.get(index);
                    for (FragmentTransaction.Op op : record.mOps) {
                        Fragment fragment = op.mFragment;
                        if (fragment != null && fragment.mFragmentManager != null) {
                            FragmentStateManager fragmentStateManager =
                                    createOrGetFragmentStateManager(fragment);
//强制激活事务中的 Fragment，确保状态被正确管理（如 makeActive()
                            mFragmentStore.makeActive(fragmentStateManager);
                        }
                    }
                }
            } else {
//旧版过渡处理,若未启用状态管理器，直接启动转场动画（如共享元素动画等等）
                FragmentTransition.startTransitions(mHost.getContext(), mContainer,
                        records, isRecordPop, startIndex, endIndex,
                        false, mFragmentTransitionCallback);
            }
        }
//执行操作核心逻辑,实际执行事务中的操作（如 onCreate()/onAttach() 生命周期调用、视图挂载/移除）。
//注意：事务处理的核心，直接修改 Fragment 状态和视图层级，会根据事务各种操作调用fragment的方法
        executeOps(records, isRecordPop, startIndex, endIndex);

        if (USE_STATE_MANAGER) {
            // The last operation determines the overall direction, this ensures that operations
            // such as push, push, pop, push are correctly considered a push
            boolean isPop = isRecordPop.get(endIndex - 1);
            // Ensure that Fragments directly affected by operations
            // are moved to their expected state in operation order
            for (int index = startIndex; index < endIndex; index++) {
                BackStackRecord record = records.get(index);
                if (isPop) {
//// 逆序处理 Pop 操作的 Fragment 状态
                    // Pop operations get applied in reverse order
                    for (int opIndex = record.mOps.size() - 1; opIndex >= 0; opIndex--) {
                        FragmentTransaction.Op op = record.mOps.get(opIndex);
                        Fragment fragment = op.mFragment;
                        if (fragment != null) {
                            FragmentStateManager fragmentStateManager =
                                    createOrGetFragmentStateManager(fragment);
                            fragmentStateManager.moveToExpectedState();
                        }
                    }
                } else {
                    for (FragmentTransaction.Op op : record.mOps) {
                        Fragment fragment = op.mFragment;
                        if (fragment != null) {
                            FragmentStateManager fragmentStateManager =
                                    createOrGetFragmentStateManager(fragment);
//            // 顺序处理正向操作的 Fragment 状态
                            fragmentStateManager.moveToExpectedState();
                        }
                    }
                }

            }
            // And only then do we move all other fragments to the current state
//生命周期处理
            moveToState(mCurState, true);
            Set<SpecialEffectsController> changedControllers = collectChangedControllers(
                    records, startIndex, endIndex);
            for (SpecialEffectsController controller : changedControllers) {
                controller.updateOperationDirection(isPop);
                controller.markPostponedState();
                controller.executePendingOperations();
            }
        } else {
            int postponeIndex = endIndex;
            if (allowReordering) {
                ArraySet<Fragment> addedFragments = new ArraySet<>();
                addAddedFragments(addedFragments);
                postponeIndex = postponePostponableTransactions(records, isRecordPop,
                        startIndex, endIndex, addedFragments);
                makeRemovedFragmentsInvisible(addedFragments);
            }

            if (postponeIndex != startIndex && allowReordering) {
                // need to run something now
                if (mCurState >= Fragment.CREATED) {
                    FragmentTransition.startTransitions(mHost.getContext(), mContainer,
                            records, isRecordPop, startIndex,
                            postponeIndex, true, mFragmentTransitionCallback);
                }
                moveToState(mCurState, true);
            }
        }

        for (int recordNum = startIndex; recordNum < endIndex; recordNum++) {
            final BackStackRecord record = records.get(recordNum);
            final boolean isPop = isRecordPop.get(recordNum);
            if (isPop && record.mIndex >= 0) {
                record.mIndex = -1;
            }
            record.runOnCommitRunnables();
        }
        if (addToBackStack) {
            reportBackStackChanged();
        }
    }





 void executeOps() {
        final int numOps = mOps.size();
        for (int opNum = 0; opNum < numOps; opNum++) {
            final Op op = mOps.get(opNum);
            final Fragment f = op.mFragment;
            if (f != null) {
                f.setPopDirection(false);
                f.setNextTransition(mTransition);
                f.setSharedElementNames(mSharedElementSourceNames, mSharedElementTargetNames);
            }
            switch (op.mCmd) {
                case OP_ADD:
                     //addFragment得操作
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.setExitAnimationOrder(f, false);
                    mManager.addFragment(f);
                    break;
                case OP_REMOVE:
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.removeFragment(f);
                    break;
                case OP_HIDE:
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.hideFragment(f);
                    break;
                case OP_SHOW:
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.setExitAnimationOrder(f, false);
                    mManager.showFragment(f);
                    break;
                case OP_DETACH:
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.detachFragment(f);
                    break;
                case OP_ATTACH:
                    f.setAnimations(op.mEnterAnim, op.mExitAnim, op.mPopEnterAnim, op.mPopExitAnim);
                    mManager.setExitAnimationOrder(f, false);
                    mManager.attachFragment(f);
                    break;
                case OP_SET_PRIMARY_NAV:
                    mManager.setPrimaryNavigationFragment(f);
                    break;
                case OP_UNSET_PRIMARY_NAV:
                    mManager.setPrimaryNavigationFragment(null);
                    break;
                case OP_SET_MAX_LIFECYCLE:
                    mManager.setMaxLifecycle(f, op.mCurrentMaxState);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown cmd: " + op.mCmd);
            }
            if (!mReorderingAllowed && op.mCmd != OP_ADD && f != null) {
                if (!FragmentManager.USE_STATE_MANAGER) {
                    mManager.moveFragmentToExpectedState(f);
                }
            }
        }
        if (!mReorderingAllowed && !FragmentManager.USE_STATE_MANAGER) {
            // Added fragments are added at the end to comply with prior behavior.
            mManager.moveToState(mManager.mCurState, true);
        }
    }
而在生命周期的处理中，会在处理oncreate的时候进行把view添加到容器中，后续详细分析这个
```

总结：到这里就已经处理了事务，并且走了fragment的生命逻辑了，这里面涉及到的

FragmentManager实则是FragmentImpl，而beginTransaction实则是维护了一个数组，其中这个数组是存放了类似于add，remove，replace，show，hide等操作到数组中，在commit的时候，会拿这个数组进行组装为序列，最终根据具体事务给到FragmentManager管理，同时进行生命周期的同步

到这里可以知道为啥平时我们开发中commit之后有报activity状态异常

# 问题1Can not perform this action after

```java
java.Lang.ILlegalstateException:Can not perform this action after onSaveInstancestate
at androidx.fragment.app.FragmentManagerlmpL.checkstateLoss(FragmentManagerImpl.iava:1536)
at androidx.fragment.app.FragmentManagerImpl.enqueveAction(FraqmentManagerImpl.java:1558)
at androidx.fragment.app.BackStackRecord.commiltInternal(BackStackRecord.java:317)
at androidx.fragment.app.BackStackRecord.commit(BackStackRecord.java:282)
at com.higher.Lazyfragment.MainActivity.onSaveInstancestate(MainActivity.java:75)
at android.app.Activity.performSaveInstancestate(Activity java:1430)
at android.app.Instrumentation.callActivityOnSaveInstancestate(Instrumentation.java:1300)
```

原因在onSaveInstancestate之后但没有调用onRestoreInstanceState之前进行commit。这种问题，一般是请求接口成功后需要显示一个fragment，或者收到某个消息的时候显示fragment

怎么解决：

- 自己判断getSupportFragmentManager().isStateSaved()，return

- commit()改为commitAllowingStateLoss(),后续会说这些方法的区别

- 在界面可见的时候才进行framgent提交

1.会导致事务没有提交【对于重要的显示来说不行，对于可有可没的显示来说可以，比如一些弹窗引导等】
2.1commitAllowingStateLoss()就是不会检查activity的状态了。比如切换屏幕在介于onSaveInstancestate到onRestoreInstanceState中进行commitAllowingStateLoss。此时提交的fragment状态也是没有被保存的。当activity在onRestoreInstanceState之后可能会导致fragment没有被恢复。和实则需要的显示导致不一致。

2.2有比如在假设你在 Activity A 的 `onSaveInstanceState()` 方法被调用后（切换后台），使用 `commitAllowingStateLoss()` 提交了一个添加 Fragment B 的事务。此时：

- ​**若系统未杀死 Activity A**：Fragment B 会正常显示；

- ​**若系统因内存不足杀死 Activity A**：当用户返回app时，系统会通过 `onSaveInstanceState()` 保存的状态重建 Activity A，但 `commitAllowingStateLoss()` 提交的 Fragment B ​**不会被恢复**，导致界面缺失该 Fragment，而这种会导致。`commitAllowingStateLoss()` 是权宜之计，**虽能规避崩溃，但需承担状态丢失风险**。核心原则是：​**优先规避生命周期冲突**，仅在非关键操作中谨慎使用，并配合状态恢复逻辑确保一致性

3.工具类

```java
public class LifecycleUtils {
    public static void runWhenResumed(Lifecycle lifecycle, Runnable action) {
        lifecycle.addObserver(new LifecycleEventObserver() {
            @Override
            public void onStateChanged(@NonNull LifecycleOwner source,
                                       @NonNull Lifecycle.Event event) {
                if (event == Lifecycle.Event.ON_RESUME) {
                    lifecycle.removeObserver(this);
                    if (Looper.myLooper() != Looper.getMainLooper()) {
                        new Handler(Looper.getMainLooper()).post(action);
                    } else {
                        action.run();
                    }
                }
            }
        });
    }
}

// 调用方式,比如在请求接口成功的时候调用，后续界面可见会继续进行fragment操作
LifecycleUtils.runWhenResumed(getLifecycle(), () -> {
    // 显示 Fragment Dialog
    showFragmentDialog();
});
```

# 问题2commit之后无法立马findFragment

```java
 getSupportFragmentManager().findFragmentById()
 getSupportFragmentManager().findFragmentByTag()
```

根据上面的源码可以知道commit是通过handler去操作的。可能commit还没执行完就执行findFragmentByTag等，会找不到到，此时可以根据commit之后，自己通过handler发送一条消息，然后在handlerMessage里面收到消息的时候再进行findFragmentByTag等操作，因为handler的消息处理事先进先出的
