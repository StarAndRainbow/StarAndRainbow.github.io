# ListAdapter

这个适配器google对Recyclerview.Adapter封装了一次，主要是用了diffUtil和AsyncListDiffer

## 好处

- 不用开发者自己计算需要更改【增删】的item下标

- ui视觉上保留动画显示,使用mAdapter.notifyDataSetChanged();无动画

- item内容刷新，不会导致闪烁问题

## 大致原理

大致说说原理，里面的diffutil是用了myers算法的，主要计算两个数据集的区别，然后对ui进行刷新改变。又由于对比是耗时操作，所以用了AsyncListDiffer来进行异步计算，主线程更新[hanlder主线程更新，子线程计算两个数据集的区别]

## ListAdapter用法

```java
class MyAdapter : ListAdapter<DataItem, MyAdapter.ViewHolder>(DiffCallback()) {
    // 定义 ViewHolder，管理视图组件
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val textView: TextView = view.findViewById(R.id.text_view)
    }

    // 数据差异比较逻辑
    class DiffCallback : DiffUtil.ItemCallback<DataItem>() {
        override fun areItemsTheSame(oldItem: DataItem, newItem: DataItem) =
            oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: DataItem, newItem: DataItem) =
            oldItem == newItem
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_layout, parent, false))

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.textView.text = getItem(position).content
    }
}
```

```java
adapter.submitList(newDataList)
```

这里payload的用法不展示，这里有个demo，有兴趣的自己看看

**[DiffUtilPayloadDemo](https://github.com/jshvarts/DiffUtilPayloadDemo)**

```java
-ListAdapter

 final AsyncListDiffer<T> mDiffer;

   protected ListAdapter(@NonNull DiffUtil.ItemCallback<T> diffCallback) {
        mDiffer = new AsyncListDiffer<>(new AdapterListUpdateCallback(this),
                new AsyncDifferConfig.Builder<>(diffCallback).build());
        mDiffer.addListListener(mListener);
    }
```

分析这几个类，传入一个回调，用于比较item和item内内容是否相同

- AsyncListDiffer：使用算法比较

- AdapterListUpdateCallback：封装了对适配器的操作，插入删除移动等

- new AsyncDifferConfig.Builder<>(diffCallback).build())：配置类，回调，子线程，主线程

实则都传给AsyncListDiffer持有，意味着AsyncListDiffer有了比较item是否一样，和调用适配器操作recyclerview的能力

```java
    public void submitList(@Nullable List<T> list) {
        mDiffer.submitList(list);
    }
```

设置数据

```java
public void submitList(@Nullable final List<T> newList,
            @Nullable final Runnable commitCallback) {
         //...
        final List<T> oldList = mList;
        //给线程池提交了一个任务
        mConfig.getBackgroundThreadExecutor().execute(new Runnable() {
            @Override
            public void run() {
                //调用DiffUtil.calculateDiff计算结果
                final DiffUtil.DiffResult result = DiffUtil.calculateDiff(new DiffUtil.Callback() {
                    @Override
                    public int getOldListSize() {
                        return oldList.size();
                    }

                    @Override
                    public int getNewListSize() {
                        return newList.size();
                    }

                    @Override
                    public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
                        T oldItem = oldList.get(oldItemPosition);
                        T newItem = newList.get(newItemPosition);
                        if (oldItem != null && newItem != null) {
                            //实则是通过我们业务写的判断来判断item是否一致的 
                            return mConfig.getDiffCallback().areItemsTheSame(oldItem, newItem);
                        }
                        // If both items are null we consider them the same.
                        return oldItem == null && newItem == null;
                    }

                    @Override
                    public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
                        T oldItem = oldList.get(oldItemPosition);
                        T newItem = newList.get(newItemPosition);
                        if (oldItem != null && newItem != null) {
                            //同上
                            return mConfig.getDiffCallback().areContentsTheSame(oldItem, newItem);
                        }
                        if (oldItem == null && newItem == null) {
                            return true;
                        }

                        throw new AssertionError();
                    }

                    @Nullable
                    @Override
                    public Object getChangePayload(int oldItemPosition, int newItemPosition) {
                        T oldItem = oldList.get(oldItemPosition);
                        T newItem = newList.get(newItemPosition);
                        if (oldItem != null && newItem != null) {
                            //同上
                            return mConfig.getDiffCallback().getChangePayload(oldItem, newItem);
                        }

                        throw new AssertionError();
                    }
                });
               //来到主线程的任务，实则是handler
                mMainThreadExecutor.execute(new Runnable() {
                    @Override
                    public void run() {
                        if (mMaxScheduledGeneration == runGeneration) {
                            latchList(newList, result, commitCallback);
                        }
                    }
                });
            }
        });
    }
```

```java
  void latchList(
            @NonNull List<T> newList,
            @NonNull DiffUtil.DiffResult diffResult,
            @Nullable Runnable commitCallback) {
        final List<T> previousList = mReadOnlyList;
        mList = newList;
        // notify last, after list is updated
        mReadOnlyList = Collections.unmodifiableList(newList);
        //mUpdateCallback实则就是持有了adapter，可以通过adapter做各种操作
        diffResult.dispatchUpdatesTo(mUpdateCallback);
        //最后回调提交数据回调
        onCurrentListChanged(previousList, commitCallback);
    }
```

看完这个实则重要的只有两个

```java
DiffUtil.calculateDiff---计算

diffResult.dispatchUpdatesTo(mUpdateCallback);--更新适配器
```

```java
public static DiffResult calculateDiff(@NonNull Callback cb, boolean detectMoves) {
        //两个集合长度
        final int oldSize = cb.getOldListSize();
        final int newSize = cb.getNewListSize();
        //保存对角线
        final List<Diagonal> diagonals = new ArrayList<>();

        // instead of a recursive implementation, we keep our own stack to avoid potential stack
        // overflow exceptions
       //通过 stack 管理待处理的 Range（新旧列表的某个区间），避免递归导致的栈溢出。初始将整个列表范围压入栈。
        final List<Range> stack = new ArrayList<>();

        stack.add(new Range(0, oldSize, 0, newSize));

        final int max = (oldSize + newSize + 1) / 2;
        // allocate forward and backward k-lines. K lines are diagonal lines in the matrix. (see the
        // paper for details)
        // These arrays lines keep the max reachable position for each k-line.
        final CenteredArray forward = new CenteredArray(max * 2 + 1);
        final CenteredArray backward = new CenteredArray(max * 2 + 1);

        // We pool the ranges to avoid allocations for each recursive call.
        final List<Range> rangePool = new ArrayList<>();
//每次从栈中取出 Range，调用 midPoint 方法寻找该范围内最长的公共子序列（即 Snake 对角线），分割剩余部分继续处理，直到栈空。
        while (!stack.isEmpty()) {
            final Range range = stack.remove(stack.size() - 1);
//forward 和 backward 是 CenteredArray 类型的数组，用于记录动态规划中的中间状态，分别表示正向和反向计算的 k 线（对角线）最大可达位置。
//这种设计借鉴了 ​Myers 差异算法，通过分治策略减少计算复杂度
            final Snake snake = midPoint(range, cb, forward, backward);
            if (snake != null) {
                // if it has a diagonal, save it
                if (snake.diagonalSize() > 0) {
                    diagonals.add(snake.toDiagonal());
                }
                // add new ranges for left and right
                final Range left = rangePool.isEmpty() ? new Range() : rangePool.remove(
                        rangePool.size() - 1);
                left.oldListStart = range.oldListStart;
                left.newListStart = range.newListStart;
                left.oldListEnd = snake.startX;
                left.newListEnd = snake.startY;
                stack.add(left);

                // re-use range for right
                //noinspection UnnecessaryLocalVariable
                final Range right = range;
                right.oldListEnd = range.oldListEnd;
                right.newListEnd = range.newListEnd;
                right.oldListStart = snake.endX;
                right.newListStart = snake.endY;
                stack.add(right);
            } else {
                rangePool.add(range);
            }

        }
        // sort snakes
        Collections.sort(diagonals, DIAGONAL_COMPARATOR);
        //返回计算结果
        return new DiffResult(cb, diagonals,
                forward.backingData(), backward.backingData(),
                detectMoves);
    }
```

至于对比的逻辑不再说，可以看上一章的myers

```java
public void dispatchUpdatesTo(@NonNull ListUpdateCallback updateCallback) {
            final BatchingListUpdateCallback batchingCallback;

            if (updateCallback instanceof BatchingListUpdateCallback) {
                //持有
                batchingCallback = (BatchingListUpdateCallback) updateCallback;
            } else {
                //持有
                batchingCallback = new BatchingListUpdateCallback(updateCallback);
                // replace updateCallback with a batching callback and override references to
                // updateCallback so that we don't call it directly by mistake
                //noinspection UnusedAssignment
                updateCallback = batchingCallback;
            }
            // track up to date current list size for moves
            // when a move is found, we record its position from the end of the list (which is
            // less likely to change since we iterate in reverse).
            // Later when we find the match of that move, we dispatch the update
            int currentListSize = mOldListSize;
            // list of postponed moves
            final Collection<PostponedUpdate> postponedUpdates = new ArrayDeque<>();
            // posX and posY are exclusive
            int posX = mOldListSize;
            int posY = mNewListSize;
            // iterate from end of the list to the beginning.
            // this just makes offsets easier since changes in the earlier indices has an effect
            // on the later indices.
            for (int diagonalIndex = mDiagonals.size() - 1; diagonalIndex >= 0; diagonalIndex--) {
                final Diagonal diagonal = mDiagonals.get(diagonalIndex);
                int endX = diagonal.endX();
                int endY = diagonal.endY();
                // dispatch removals and additions until we reach to that diagonal
                // first remove then add so that it can go into its place and we don't need
                // to offset values
                while (posX > endX) {
                    posX--;
                    // REMOVAL
                    int status = mOldItemStatuses[posX];
                    if ((status & FLAG_MOVED) != 0) {
                        int newPos = status >> FLAG_OFFSET;
                        // get postponed addition
                        PostponedUpdate postponedUpdate = getPostponedUpdate(postponedUpdates,
                                newPos, false);
                        if (postponedUpdate != null) {
                            // this is an addition that was postponed. Now dispatch it.
                            int updatedNewPos = currentListSize - postponedUpdate.currentPos;
                            //移动
                            batchingCallback.onMoved(posX, updatedNewPos - 1);
                            if ((status & FLAG_MOVED_CHANGED) != 0) {
                                Object changePayload = mCallback.getChangePayload(posX, newPos);
                                //内容更新
                                batchingCallback.onChanged(updatedNewPos - 1, 1, changePayload);
                            }
                        } else {
                            // first time we are seeing this, we'll see a matching addition
                            postponedUpdates.add(new PostponedUpdate(
                                    posX,
                                    currentListSize - posX - 1,
                                    true
                            ));
                        }
                    } else {
                        // simple removal
                        //移除
                        batchingCallback.onRemoved(posX, 1);
                        currentListSize--;
                    }
                }
                while (posY > endY) {
                    posY--;
                    // ADDITION
                    int status = mNewItemStatuses[posY];
                    if ((status & FLAG_MOVED) != 0) {
                        // this is a move not an addition.
                        // see if this is postponed
                        int oldPos = status >> FLAG_OFFSET;
                        // get postponed removal
                        PostponedUpdate postponedUpdate = getPostponedUpdate(postponedUpdates,
                                oldPos, true);
                        // empty size returns 0 for indexOf
                        if (postponedUpdate == null) {
                            // postpone it until we see the removal
                            postponedUpdates.add(new PostponedUpdate(
                                    posY,
                                    currentListSize - posX,
                                    false
                            ));
                        } else {
                            // oldPosFromEnd = foundListSize - posX
                            // we can find posX if we swap the list sizes
                            // posX = listSize - oldPosFromEnd
                            int updatedOldPos = currentListSize - postponedUpdate.currentPos - 1;
                            //移动
                            batchingCallback.onMoved(updatedOldPos, posX);
                            if ((status & FLAG_MOVED_CHANGED) != 0) {
                                Object changePayload = mCallback.getChangePayload(oldPos, posY);
                                batchingCallback.onChanged(posX, 1, changePayload);
                            }
                        }
                    } else {
                        // simple addition 
                        //插入
                        batchingCallback.onInserted(posX, 1);
                        currentListSize++;
                    }
                }
                // now dispatch updates for the diagonal
                posX = diagonal.x;
                posY = diagonal.y;
                for (int i = 0; i < diagonal.size; i++) {
                    // dispatch changes
                    if ((mOldItemStatuses[posX] & FLAG_MASK) == FLAG_CHANGED) {
                        Object changePayload = mCallback.getChangePayload(posX, posY);
                        batchingCallback.onChanged(posX, 1, changePayload);
                    }
                    posX++;
                    posY++;
                }
                // snap back for the next diagonal
                posX = diagonal.x;
                posY = diagonal.y;
            }
            batchingCallback.dispatchLastEvent();
        }
```

## 怎么保证数据一致性的

```java
 int mMaxScheduledGeneration;

 //每次submit数据的时候进行++操作

final int runGeneration = ++mMaxScheduledGeneration;



mMainThreadExecutor.execute(new Runnable() {
                    @Override
                    public void run() {
                        //更新数据的时候保证，判断版本号是否一致
                        if (mMaxScheduledGeneration == runGeneration) {
                            latchList(newList, result, commitCallback);
                        }
                    }
                });
```

实则是是通过一个数据版本号去判断的，如果版本号不一致则掉弃数据。

mMaxScheduledGeneration。这里的recyclerview1.2.1没有进行原子性操作，所以submit提交数据还是建议在主线程调用的，防止出现线程切换可见性问题，导致版本号判断不一致

## 线程处理

```java
 子线程执行
 public AsyncDifferConfig<T> build() {
            if (mBackgroundThreadExecutor == null) {
                synchronized (sExecutorLock) {
                    if (sDiffExecutor == null) {
                        sDiffExecutor = Executors.newFixedThreadPool(2);
                    }
                }
                mBackgroundThreadExecutor = sDiffExecutor;
            }
            return new AsyncDifferConfig<>(
                    mMainThreadExecutor,
                    mBackgroundThreadExecutor,
                    mDiffCallback);
        }





   public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }



 //主线程提交

    private static class MainThreadExecutor implements Executor {
        final Handler mHandler = new Handler(Looper.getMainLooper());
        MainThreadExecutor() {}
        @Override
        public void execute(@NonNull Runnable command) {
            mHandler.post(command);
        }
    }
```

子线程实则是开启了一个线程池，两个固定线程，如果有多的任务进入LinkedBlockingQueue队列。

顺带提一口，这里有一个点，这里用到了算法，虽然说是比较高效的差分算法。但是每次数据改变都会进行两个数据集合的计算。在列表数据量比较多的情况下，会消耗cpu资源

item

![](./img/item.png)

已经放不下了，这个item内容不用管它，item里面有的是互斥隐藏显示的，这里只是为了证明内容多

我项目中的item大量equals判断

```java
  @Override
    public boolean equals(Object o) {
        if (!(o instanceof V2ConversationC2CInfo)) return false;
        V2ConversationC2CInfo c2CInfo = (V2ConversationC2CInfo) o;
        return intimacyRelation == c2CInfo.intimacyRelation
                && isShowIntimacy == c2CInfo.isShowIntimacy
                && Double.compare(c2CInfo.intimacyNumber, intimacyNumber) == 0
                && isNewUser == c2CInfo.isNewUser
                && onLine == c2CInfo.onLine
                && replyRewardEndTime == c2CInfo.replyRewardEndTime
                && Objects.equals(relationSource, c2CInfo.relationSource)
                && Objects.equals(city, c2CInfo.city)
                && Objects.equals(ageCity, c2CInfo.ageCity)
                && Objects.equals(vpRoomId, c2CInfo.vpRoomId)
                && Objects.equals(videoUrl, c2CInfo.videoUrl)
                && Objects.equals(note, c2CInfo.note)
                && Objects.equals(nobleIcon, c2CInfo.nobleIcon)
                && Objects.equals(avatarFrame, c2CInfo.avatarFrame)
                && Objects.equals(nameColor, c2CInfo.nameColor)
                && Objects.equals(dayRecommend, c2CInfo.dayRecommend)
                && goldStar == c2CInfo.goldStar
                && Objects.equals(provinceName,c2CInfo.provinceName)
                && createdAt == c2CInfo.createdAt
                && Objects.equals(sex,c2CInfo.sex)
                && payUser == c2CInfo.payUser
                && Objects.equals(channel,c2CInfo.channel)
                && (distance!=null  && distance == c2CInfo.distance)
                && Objects.equals(userType,c2CInfo.userType)
                && Objects.equals(nickName,c2CInfo.nickName)
                && isShowVipTag == c2CInfo.isShowVipTag
                && Objects.equals(tips,c2CInfo.getTips())
                && wealthLevel == c2CInfo.wealthLevel
                && isGuard == c2CInfo.isGuard
                && TextUtils.equals(countryCity,c2CInfo.countryCity)
                && intimacyNumber == c2CInfo.intimacyNumber
                && TextUtils.equals(medalIcon,c2CInfo.medalIcon);

    }
    @Override
    public int hashCode() {
        return Objects.hash(intimacyRelation, isShowIntimacy, intimacyNumber, relationSource, isNewUser, onLine, city, ageCity, vpRoomId, videoUrl, note, replyRewardEndTime, nobleIcon, avatarFrame, nameColor, goldStar, dayRecommend,provinceName,createdAt,sex,payUser,channel,distance,userType,nickName,isShowVipTag,wealthLevel,countryCity,intimacyNumber,medalIcon,isGuard);
    }
```

对于社交聊天拍拖软件来说，刚刚上线的时候，系统会自动拿在线用户自动发送招呼语，导致会话最后一条消息改变，会导致频繁触发列表判断，并且这个时候如果有人发送礼物过来，需要播放礼物动效（svga，mp4礼物动效等）。这些同时触发的话，会导致cpu占用率高，爆满的时候也会有卡顿效果，cpu处理不过来，会掉帧。实则优化点就是处理这些euqals判断。

怎么处理

- 一个是可以先判断hashcode是否一样，不一样，直接返回false，一样再进行equals判断。尽量减少equals调用

- 还有一个比较简单的方法，就是先不进行equals判断item数据是否一致了，既然是用户的数据，这个数据都是保存到数据库的，而操作数据库的是后端。在后端操作用户数据更新的时候，保存一个时间戳，返回列表数据的时候带上时间戳，在这里判断时间戳是否一致就行了，如果不一致表示item数据不一样了（建议）

```java
   @Override
    public boolean equals(Object o) {
        if (!(o instanceof V2ConversationC2CInfo)) return false;
        V2ConversationC2CInfo c2CInfo = (V2ConversationC2CInfo) o;
        return timestamp == c2CInfo.timestamp;
    }
```
