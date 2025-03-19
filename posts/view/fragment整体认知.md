# fragment



首选需要明确一点，fragment是啥，fragment其实就是对view的封装，让view做到逻辑和ui复用效果。当然自定义组合控件view也可以，但是得在各个activity中处理生命周期，而fragment已经封装好对应的生命周期并且activity会调用





既然fragment实则是view，那么就需要viewGroup.add(childView)



那么这里把Activity看做是viewGroup，fragment看做view，那么viewgroup对子view的操作可以进行add，remove，并且childView自身可以进行setVisibility(View.VISIBLE),setVisibility(View.GONE)等操作，并且作为viewGroup是可以管理多个子View的。基于这个认知



引出FragmentManager，为何需要FragmentManager，需要管理多个view（这里实则是fragment），对各个fragment进行操作，生命周期，旋转屏幕等回调。



然后引出事务，为什么需要事务FragmentTransaction，其实就是对fragment进行显示，隐藏等操作



所以fragment叫做碎片，可以理解吧，独立成块，处理自身逻辑，生命周期需要依赖activity。基于这个共识再往下看





```java
- FragmentActivity

    final FragmentController mFragments = FragmentController.createController(new HostCallbacks());




   @NonNull
    public FragmentManager getSupportFragmentManager() {
        return mFragments.getSupportFragmentManager();
    }



  public void onMultiWindowModeChanged(boolean isInMultiWindowMode) {
        mFragments.dispatchMultiWindowModeChanged(isInMultiWindowMode);
    }




@Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        mFragments.noteStateNotSaved();
        super.onConfigurationChanged(newConfig);
        mFragments.dispatchConfigurationChanged(newConfig);
    }



   @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mFragmentLifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
        mFragments.dispatchCreate();
    }


   @Override
    public void onLowMemory() {
        super.onLowMemory();
        mFragments.dispatchLowMemory();
    }



    @Override
    @CallSuper
    protected void onNewIntent(@SuppressLint("UnknownNullness") Intent intent) {
        mFragments.noteStateNotSaved();
        super.onNewIntent(intent);
    }
```

从上面的代码可以看出来，FragmentController实则做的是什么工作，分发activity的各种事件，分发给谁，这里假定直接分发给fragment，那么这里做的就是activity和fragment交互桥梁的作用。





随便点击一个mFragments的方法查看，看里面做了啥

```java
    - FragmentController
    
    
    private final FragmentHostCallback<?> mHost;
    
    
    @NonNull
    public static FragmentController createController(@NonNull FragmentHostCallback<?> callbacks) {
        return new FragmentController(checkNotNull(callbacks, "callbacks == null"));
    }
    
    private FragmentController(FragmentHostCallback<?> callbacks) {
        mHost = callbacks;
    }

    
    @NonNull
    public FragmentManager getSupportFragmentManager() {
        return mHost.mFragmentManager;
    }
    
    
    public Fragment findFragmentByWho(@NonNull String who) {
        return mHost.mFragmentManager.findFragmentByWho(who);
    }
    
    
    public void dispatchCreate() {
        mHost.mFragmentManager.dispatchCreate();
    }

```



FragmentController是FragmentActivity的内部类，所以是持有了activity对象的，然后查看FragmentController中的各种操作都是通过mHost的mFragmentManager来操作的，



其中mFragmentManager就是：

```java
final FragmentManager mFragmentManager = new FragmentManagerImpl();
```







# show，hide，add，replace，remove

基于上一次对fragment的了解，本次来看看这几个方法的区别。



首先需要知道事务实则是对一个数组的维护，而show，hide，add，remove，replace等事务操作，实则是往数组中添加一个op对象



```java
- FragmentTransaction   
     ArrayList<Op> mOps = new ArrayList<>();
    
    
    
     static final int OP_NULL = 0;
    static final int OP_ADD = 1;
    static final int OP_REPLACE = 2;
    static final int OP_REMOVE = 3;
    static final int OP_HIDE = 4;
    static final int OP_SHOW = 5;
    static final int OP_DETACH = 6;
    static final int OP_ATTACH = 7;
    static final int OP_SET_PRIMARY_NAV = 8;
    static final int OP_UNSET_PRIMARY_NAV = 9;
    static final int OP_SET_MAX_LIFECYCLE = 10;

    static final class Op {
        int mCmd;
        Fragment mFragment;
        int mEnterAnim;
        int mExitAnim;
        int mPopEnterAnim;
        int mPopExitAnim;
        Lifecycle.State mOldMaxState;
        Lifecycle.State mCurrentMaxState;
    }

```



需要提一嘴的是FragmentTransaction和FragmentManager是相互持有的

```java
- FragmentManager

    @NonNull
    public FragmentTransaction beginTransaction() {
        return new BackStackRecord(this);
    }
```



然后查看commit方法

最终回来到下面的方法，找不到调用路径的可以看上一章的内容



```java
- BackStackRecord


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


- FragmentManager


    FragmentStateManager addFragment(@NonNull Fragment fragment) {
        if (isLoggingEnabled(Log.VERBOSE)) Log.v(TAG, "add: " + fragment);
        FragmentStateManager fragmentStateManager = createOrGetFragmentStateManager(fragment);
        fragment.mFragmentManager = this;
        mFragmentStore.makeActive(fragmentStateManager);
        if (!fragment.mDetached) {
            //关注点1 
            mFragmentStore.addFragment(fragment);
            fragment.mRemoving = false;
            if (fragment.mView == null) {
                fragment.mHiddenChanged = false;
            }
            if (isMenuAvailable(fragment)) {
                mNeedMenuInvalidate = true;
            }
        }
        return fragmentStateManager;
    }


    private final FragmentStore mFragmentStore = new FragmentStore();

    -FragmentStore

    private final ArrayList<Fragment> mAdded = new ArrayList<>();

    void addFragment(@NonNull Fragment fragment) {
        if (mAdded.contains(fragment)) {
            throw new IllegalStateException("Fragment already added: " + fragment);
        }
        synchronized (mAdded) {
            mAdded.add(fragment);
        }
        fragment.mAdded = true;
    }
    //实则就是add到一个数组中了


- FragmentManager



    void removeFragment(@NonNull Fragment fragment) {
        if (isLoggingEnabled(Log.VERBOSE)) {
            Log.v(TAG, "remove: " + fragment + " nesting=" + fragment.mBackStackNesting);
        }
        final boolean inactive = !fragment.isInBackStack();
        if (!fragment.mDetached || inactive) {
            //关注点2，同上，只是改成了remove，从数组中移除
            mFragmentStore.removeFragment(fragment);
            if (isMenuAvailable(fragment)) {
                mNeedMenuInvalidate = true;
            }
            fragment.mRemoving = true;
            setVisibleRemovingFragment(fragment);
        }
    }



    void hideFragment(@NonNull Fragment fragment) {
        if (isLoggingEnabled(Log.VERBOSE)) Log.v(TAG, "hide: " + fragment);
        if (!fragment.mHidden) {
            fragment.mHidden = true;
            // Toggle hidden changed so that if a fragment goes through show/hide/show
            // it doesn't go through the animation.
            fragment.mHiddenChanged = !fragment.mHiddenChanged;
            setVisibleRemovingFragment(fragment);
        }
    }





    void showFragment(@NonNull Fragment fragment) {
        if (isLoggingEnabled(Log.VERBOSE)) Log.v(TAG, "show: " + fragment);
        if (fragment.mHidden) {
            fragment.mHidden = false;
            // Toggle hidden changed so that if a fragment goes through show/hide/show
            // it doesn't go through the animation.
            fragment.mHiddenChanged = !fragment.mHiddenChanged;
        }
    }



- FragmentManager

void moveFragmentToExpectedState(@NonNull Fragment f) {
        if (!mFragmentStore.containsActiveFragment(f.mWho)) {
            if (isLoggingEnabled(Log.DEBUG)) {
                Log.d(TAG, "Ignoring moving " + f + " to state " + mCurState
                        + "since it is not added to " + this);
            }
            return;
        }
        moveToState(f);

        if (f.mView != null) {
            if (f.mIsNewlyAdded && f.mContainer != null) {
                // Make it visible and run the animations
                if (f.mPostponedAlpha > 0f) {
                    f.mView.setAlpha(f.mPostponedAlpha);
                }
                f.mPostponedAlpha = 0f;
                f.mIsNewlyAdded = false;
                // run animations:
                FragmentAnim.AnimationOrAnimator anim = FragmentAnim.loadAnimation(
                        mHost.getContext(), f, true, f.getPopDirection());
                if (anim != null) {
                    if (anim.animation != null) {
                        f.mView.startAnimation(anim.animation);
                    } else {
                        anim.animator.setTarget(f.mView);
                        anim.animator.start();
                    }
                }
            }
        }
       //这里判断了显示与隐藏
        if (f.mHiddenChanged) {
            completeShowHideFragment(f);
        }
    }





private void completeShowHideFragment(@NonNull final Fragment fragment) {
        if (fragment.mView != null) {
            FragmentAnim.AnimationOrAnimator anim = FragmentAnim.loadAnimation(
                    mHost.getContext(), fragment, !fragment.mHidden, fragment.getPopDirection());
            if (anim != null && anim.animator != null) {
                anim.animator.setTarget(fragment.mView);
                if (fragment.mHidden) {
                    if (fragment.isHideReplaced()) {
                        fragment.setHideReplaced(false);
                    } else {
                        final ViewGroup container = fragment.mContainer;
                        final View animatingView = fragment.mView;
                        container.startViewTransition(animatingView);
                        // Delay the actual hide operation until the animation finishes,
                        // otherwise the fragment will just immediately disappear
                        anim.animator.addListener(new AnimatorListenerAdapter() {
                            @Override
                            public void onAnimationEnd(Animator animation) {
                                container.endViewTransition(animatingView);
                                animation.removeListener(this);
                                if (fragment.mView != null && fragment.mHidden) {
                                    fragment.mView.setVisibility(View.GONE);
                                }
                            }
                        });
                    }
                } else {
                    fragment.mView.setVisibility(View.VISIBLE);
                }
                anim.animator.start();
            } else {
                if (anim != null) {
                    fragment.mView.startAnimation(anim.animation);
                    anim.animation.start();
                }
                final int visibility = fragment.mHidden && !fragment.isHideReplaced()
                        ? View.GONE
                        : View.VISIBLE;
                fragment.mView.setVisibility(visibility);
                if (fragment.isHideReplaced()) {
                    fragment.setHideReplaced(false);
                }
            }
        }
        invalidateMenuForFragment(fragment);
        fragment.mHiddenChanged = false;
        fragment.onHiddenChanged(fragment.mHidden);
    }
```



add操作实则是add到数组中，remove操作实则是移除，show，hide实则就是设置view是否可见,那么replace实则做了啥呢



```java
 Fragment expandOps(ArrayList<Fragment> added, Fragment oldPrimaryNav) {
        for (int opNum = 0; opNum < mOps.size(); opNum++) {
            final Op op = mOps.get(opNum);
            switch (op.mCmd) {
                case OP_ADD:
                case OP_ATTACH:
                    added.add(op.mFragment);
                    break;
                case OP_REMOVE:
                case OP_DETACH: {
                    added.remove(op.mFragment);
                    if (op.mFragment == oldPrimaryNav) {
                        mOps.add(opNum, new Op(OP_UNSET_PRIMARY_NAV, op.mFragment));
                        opNum++;
                        oldPrimaryNav = null;
                    }
                }
                break;
                case OP_REPLACE: {
                    final Fragment f = op.mFragment;
                    final int containerId = f.mContainerId;
                    boolean alreadyAdded = false;
                    for (int i = added.size() - 1; i >= 0; i--) {
                        final Fragment old = added.get(i);
                        if (old.mContainerId == containerId) {
                            if (old == f) {
                                alreadyAdded = true;
                            } else {
                                // This is duplicated from above since we only make
                                // a single pass for expanding ops. Unset any outgoing primary nav.
                                if (old == oldPrimaryNav) {
                                    mOps.add(opNum, new Op(OP_UNSET_PRIMARY_NAV, old));
                                    opNum++;
                                    oldPrimaryNav = null;
                                }
                                final Op removeOp = new Op(OP_REMOVE, old);
                                removeOp.mEnterAnim = op.mEnterAnim;
                                removeOp.mPopEnterAnim = op.mPopEnterAnim;
                                removeOp.mExitAnim = op.mExitAnim;
                                removeOp.mPopExitAnim = op.mPopExitAnim;
                                mOps.add(opNum, removeOp);
                                added.remove(old);
                                opNum++;
                            }
                        }
                    }
                    if (alreadyAdded) {
                        mOps.remove(opNum);
                        opNum--;
                    } else {
                        op.mCmd = OP_ADD;
                        added.add(f);
                    }
                }
                break;
                case OP_SET_PRIMARY_NAV: {
                    // It's ok if this is null, that means we will restore to no active
                    // primary navigation fragment on a pop.
                    mOps.add(opNum, new Op(OP_UNSET_PRIMARY_NAV, oldPrimaryNav));
                    opNum++;
                    // Will be set by the OP_SET_PRIMARY_NAV we inserted before when run
                    oldPrimaryNav = op.mFragment;
                }
                break;
            }
        }
        return oldPrimaryNav;
    }
```

可以看到上面，实则OP_REPLACE被改成了remove和add的操作了







至于怎么显示出来和回调生命周期的就得看下面这个方法了

```java
 
 - FragmentManager
 
 void moveToState(@NonNull Fragment f, int newState) {
        FragmentStateManager fragmentStateManager = mFragmentStore.getFragmentStateManager(f.mWho);
        if (fragmentStateManager == null) {
            // Ideally, we only call moveToState() on active Fragments. However,
            // in restoreSaveState() we can call moveToState() on retained Fragments
            // just to clean them up without them ever being added to mActive.
            // For these cases, a brand new FragmentStateManager is enough.
            fragmentStateManager = new FragmentStateManager(mLifecycleCallbacksDispatcher,
                    mFragmentStore, f);
            // Only allow this FragmentStateManager to go up to CREATED at the most
            fragmentStateManager.setFragmentManagerState(Fragment.CREATED);
        }
        // When inflating an Activity view with a resource instead of using setContentView(), and
        // that resource adds a fragment using the <fragment> tag (i.e. from layout and in layout),
        // the fragment will move to the VIEW_CREATED state before the fragment manager
        // moves to CREATED. So when moving the fragment manager moves to CREATED and the
        // inflated fragment is already in VIEW_CREATED we need to move new state up from CREATED
        // to VIEW_CREATED. This avoids accidentally moving the fragment back down to CREATED
        // which would immediately destroy the Fragment's view. We rely on computeExpectedState()
        // to pull the state back down if needed.
        if (f.mFromLayout && f.mInLayout && f.mState == Fragment.VIEW_CREATED) {
            newState = Math.max(newState, Fragment.VIEW_CREATED);
        }
        newState = Math.min(newState, fragmentStateManager.computeExpectedState());
        if (f.mState <= newState) {
            // If we are moving to the same state, we do not need to give up on the animation.
            if (f.mState < newState && !mExitAnimationCancellationSignals.isEmpty()) {
                // The fragment is currently being animated...  but!  Now we
                // want to move our state back up.  Give up on waiting for the
                // animation and proceed from where we are.
                cancelExitAnimation(f);
            }
            switch (f.mState) {
                case Fragment.INITIALIZING:
                    if (newState > Fragment.INITIALIZING) {
                        fragmentStateManager.attach();
                    }
                    // fall through
                case Fragment.ATTACHED:
                    if (newState > Fragment.ATTACHED) {
                        fragmentStateManager.create();
                    }
                    // fall through
                case Fragment.CREATED:
                    // We want to unconditionally run this anytime we do a moveToState that
                    // moves the Fragment above INITIALIZING, including cases such as when
                    // we move from CREATED => CREATED as part of the case fall through above.
                    if (newState > Fragment.INITIALIZING) {
                        fragmentStateManager.ensureInflatedView();
                    }

                    if (newState > Fragment.CREATED) {
                        fragmentStateManager.createView();
                    }
                    // fall through
                case Fragment.VIEW_CREATED:
                    if (newState > Fragment.VIEW_CREATED) {
                        fragmentStateManager.activityCreated();
                    }
                    // fall through
                case Fragment.ACTIVITY_CREATED:
                    if (newState > Fragment.ACTIVITY_CREATED) {
                        fragmentStateManager.start();
                    }
                    // fall through
                case Fragment.STARTED:
                    if (newState > Fragment.STARTED) {
                        fragmentStateManager.resume();
                    }
            }
        } else if (f.mState > newState) {
            switch (f.mState) {
                case Fragment.RESUMED:
                    if (newState < Fragment.RESUMED) {
                        fragmentStateManager.pause();
                    }
                    // fall through
                case Fragment.STARTED:
                    if (newState < Fragment.STARTED) {
                        fragmentStateManager.stop();
                    }
                    // fall through
                case Fragment.ACTIVITY_CREATED:
                    if (newState < Fragment.ACTIVITY_CREATED) {
                        if (isLoggingEnabled(Log.DEBUG)) {
                            Log.d(TAG, "movefrom ACTIVITY_CREATED: " + f);
                        }
                        if (f.mView != null) {
                            // Need to save the current view state if not
                            // done already.
                            if (mHost.onShouldSaveFragmentState(f) && f.mSavedViewState == null) {
                                fragmentStateManager.saveViewState();
                            }
                        }
                    }
                    // fall through
                case Fragment.VIEW_CREATED:
                    if (newState < Fragment.VIEW_CREATED) {
                        FragmentAnim.AnimationOrAnimator anim = null;
                        if (f.mView != null && f.mContainer != null) {
                            // Stop any current animations:
                            f.mContainer.endViewTransition(f.mView);
                            f.mView.clearAnimation();
                            // If parent is being removed, no need to handle child animations.
                            if (!f.isRemovingParent()) {
                                if (mCurState > Fragment.INITIALIZING && !mDestroyed
                                        && f.mView.getVisibility() == View.VISIBLE
                                        && f.mPostponedAlpha >= 0) {
                                    anim = FragmentAnim.loadAnimation(mHost.getContext(),
                                            f, false, f.getPopDirection());
                                }
                                f.mPostponedAlpha = 0;
                                // Robolectric tests do not post the animation like a real device
                                // so we should keep up with the container and view in case the
                                // fragment view is destroyed before we can remove it.
                                ViewGroup container = f.mContainer;
                                View view = f.mView;
                                if (anim != null) {
                                    FragmentAnim.animateRemoveFragment(f, anim,
                                            mFragmentTransitionCallback);
                                }
                                container.removeView(view);
                                if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
                                    Log.v(FragmentManager.TAG, "Removing view " + view + " for "
                                            + "fragment " + f + " from container " + container);
                                }
                                // If the local container is different from the fragment
                                // container, that means onAnimationEnd was called, onDestroyView
                                // was dispatched and the fragment was already moved to state, so
                                // we should early return here instead of attempting to move to
                                // state again.
                                if (container != f.mContainer) {
                                    return;
                                }
                            }
                        }
                        // If a fragment has an exit animation (or transition), do not destroy
                        // its view immediately and set the state after animating
                        if (mExitAnimationCancellationSignals.get(f) == null) {
                            fragmentStateManager.destroyFragmentView();
                        }
                    }
                    // fall through
                case Fragment.CREATED:
                    if (newState < Fragment.CREATED) {
                        if (mExitAnimationCancellationSignals.get(f) != null) {
                            // We are waiting for the fragment's view to finish animating away.
                            newState = Fragment.CREATED;
                        } else {
                            fragmentStateManager.destroy();
                        }
                    }
                    // fall through
                case Fragment.ATTACHED:
                    if (newState < Fragment.ATTACHED) {
                        fragmentStateManager.detach();
                    }
            }
        }

        if (f.mState != newState) {
            if (isLoggingEnabled(Log.DEBUG)) {
                Log.d(TAG, "moveToState: Fragment state for " + f + " not updated inline; "
                        + "expected state " + newState + " found " + f.mState);
            }
            f.mState = newState;
        }
    }
```



清一色通过fragmentStateManager来进行回调

```java
        FragmentStateManager fragmentStateManager = mFragmentStore.getFragmentStateManager(f.mWho);
```





在mFragmentStore中拿出来的，并且检测了是否为空，为空则新建一个并且状态设置为create



然后判断上一次的生命状态和本次的生命状态，然后通过生命周期的升序和降序来确认fragment对应的生命周期



挑一个createView来看下



```java
void createView() {
        if (mFragment.mFromLayout) {
            // This case is handled by ensureInflatedView(), so there's nothing
            // else we need to do here.
            return;
        }
        if (FragmentManager.isLoggingEnabled(Log.DEBUG)) {
            Log.d(TAG, "moveto CREATE_VIEW: " + mFragment);
        }
        LayoutInflater layoutInflater = mFragment.performGetLayoutInflater(
                mFragment.mSavedFragmentState);
        ViewGroup container = null;
        if (mFragment.mContainer != null) {
            container = mFragment.mContainer;
        } else if (mFragment.mContainerId != 0) {
            if (mFragment.mContainerId == View.NO_ID) {
                throw new IllegalArgumentException("Cannot create fragment " + mFragment
                        + " for a container view with no id");
            }
            FragmentContainer fragmentContainer = mFragment.mFragmentManager.getContainer();
            container = (ViewGroup) fragmentContainer.onFindViewById(mFragment.mContainerId);
            if (container == null && !mFragment.mRestored) {
                String resName;
                try {
                    resName = mFragment.getResources().getResourceName(mFragment.mContainerId);
                } catch (Resources.NotFoundException e) {
                    resName = "unknown";
                }
                throw new IllegalArgumentException("No view found for id 0x"
                        + Integer.toHexString(mFragment.mContainerId) + " ("
                        + resName + ") for fragment " + mFragment);
            }
        }
        mFragment.mContainer = container;
        //回调方法
        mFragment.performCreateView(layoutInflater, container, mFragment.mSavedFragmentState);
        if (mFragment.mView != null) {
            mFragment.mView.setSaveFromParentEnabled(false);
            mFragment.mView.setTag(R.id.fragment_container_view_tag, mFragment);
            if (container != null) {
                //添加到容器中
                addViewToContainer();
            }
            if (mFragment.mHidden) {
                mFragment.mView.setVisibility(View.GONE);
            }
            // How I wish we could use doOnAttach
            if (ViewCompat.isAttachedToWindow(mFragment.mView)) {
                ViewCompat.requestApplyInsets(mFragment.mView);
            } else {
                final View fragmentView = mFragment.mView;
                fragmentView.addOnAttachStateChangeListener(
                        new View.OnAttachStateChangeListener() {
                            @Override
                            public void onViewAttachedToWindow(View v) {
                                fragmentView.removeOnAttachStateChangeListener(this);
                                ViewCompat.requestApplyInsets(fragmentView);
                            }

                            @Override
                            public void onViewDetachedFromWindow(View v) {
                            }
                        });
            }
            //回调方法
            mFragment.performViewCreated();
            mDispatcher.dispatchOnFragmentViewCreated(
                    mFragment, mFragment.mView, mFragment.mSavedFragmentState, false);
            int postOnViewCreatedVisibility = mFragment.mView.getVisibility();
            float postOnViewCreatedAlpha = mFragment.mView.getAlpha();
            if (FragmentManager.USE_STATE_MANAGER) {
                mFragment.setPostOnViewCreatedAlpha(postOnViewCreatedAlpha);
                if (mFragment.mContainer != null && postOnViewCreatedVisibility == View.VISIBLE) {
                    // Save the focused view if one was set via requestFocus()
                    View focusedView = mFragment.mView.findFocus();
                    if (focusedView != null) {
                        mFragment.setFocusedView(focusedView);
                        if (FragmentManager.isLoggingEnabled(Log.VERBOSE)) {
                            Log.v(TAG, "requestFocus: Saved focused view " + focusedView
                                    + " for Fragment " + mFragment);
                        }
                    }
                    // Set the view alpha to 0
                    mFragment.mView.setAlpha(0f);
                }
            } else {
                // Only animate the view if it is visible. This is done after
                // dispatchOnFragmentViewCreated in case visibility is changed
                mFragment.mIsNewlyAdded = (postOnViewCreatedVisibility == View.VISIBLE)
                        && mFragment.mContainer != null;
            }
        }
        mFragment.mState = Fragment.VIEW_CREATED;
    }
```



总结：调用fragment方法，并且addview到容器中



# commit,commitAllowingStateLoss,commitNow,commitNowAllowingStateLoss





#### commit

 上一次看过了，做了activity的检查，并且通过hanlder提交

```java
    private void checkStateLoss() {
        if (isStateSaved()) {
            throw new IllegalStateException(
                    "Can not perform this action after onSaveInstanceState");
        }
    }
```



#### commitAllowingStateLoss

```java

    @Override
    public int commit() {
        return commitInternal(false);
    }

    @Override
    public int commitAllowingStateLoss() {
        return commitInternal(true);
    }
```

和commit只是传递参数不一样，而false会进行检测onSaveInstanceState

true，不检测







#### commitNow



```java
    @Override
    public void commitNow() {
        disallowAddToBackStack();
        mManager.execSingleAction(this, false);
    }
    
    
    
     void execSingleAction(@NonNull OpGenerator action, boolean allowStateLoss) {
        if (allowStateLoss && (mHost == null || mDestroyed)) {
            // This FragmentManager isn't attached, so drop the entire transaction.
            return;
        }
        ensureExecReady(allowStateLoss);
        if (action.generateOps(mTmpRecords, mTmpIsPop)) {
            mExecutingActions = true;
            try {
                removeRedundantOperationsAndExecute(mTmpRecords, mTmpIsPop);
            } finally {
                cleanupExec();
            }
        }

        updateOnBackPressedCallbackEnabled();
        doPendingDeferredStart();
        mFragmentStore.burpActive();
    }
```

可以看的出来没有通过hanlder提交，从名字也可以看的出来commitNow







#### commitNowAllowingStateLoss

```java
 @Override
    public void commitNowAllowingStateLoss() {
        disallowAddToBackStack();
        mManager.execSingleAction(this, true);
    }
```

和commitNow只是第二参数传递参数不同，只是检不检查状态的区别





这四个方法主要就是是否能在子线程调用，是否需要检查activity状态的区别







总结：本次记录是对上一次看fragment的补充，其实可以把fragment看做对view进行了装饰者模式就比较好理解了，对view进行补充和扩展。


