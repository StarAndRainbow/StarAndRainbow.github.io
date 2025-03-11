dagger2练习

新建一个界面

```java
public class Dagger2PracticeActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
    }
}
```

新建一个component目的是给某个界面注入数据,既然是dagger2使用apt生成，那么就是接口来的，让dagger2的apt生成自动去实现

```java
@Component
public interface Dagger2PracticeComponent {

    public void inject(Dagger2PracticeActivity dagger2PracticeActivity);
}
```

重新rebuild以下，看看这个@component生成了什么代码-------DaggerDagger2PracticeComponent

```java
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private DaggerDagger2PracticeComponent() {
       //私有的构造方法，那么肯定不是new出来的了，看怎么构造的
  }

  public static Builder builder() {
    return new Builder();
  }
  //也可以直接通过create来创建Dagger2PracticeComponent
  public static Dagger2PracticeComponent create() {
    return new Builder().build();
  }

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
  }

  //内部类Build构建，为何使用Build，Build的一般是为了给我们赋予值
  public static final class Builder {
    private Builder() {
    }
    //通过内部类的build来创建一个DaggerDagger2PracticeComponent
    public Dagger2PracticeComponent build() {
      return new DaggerDagger2PracticeComponent();
    }
  }
}
```

- 实现了Dagger2PracticeComponent

- 私有构造

- 通过静态filnal class 的Build来创建生成的DaggerDagger2PracticeComponent，当然内部也提供了create对象然我们可以拿到这个对象

- inject是空的状态

# @Inject下面来简单注入一个对象试试

```java
//界面
public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        findViewById(R.id.tv_inject).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_inject:
                Toast.makeText(Dagger2PracticeActivity.this,""+Dagger2PracticeModel,Toast.LENGTH_SHORT).show();
                break;
        }
    }
}


//module
public class Dagger2PracticeModel {

    @Inject
    public Dagger2PracticeModel() {
    }
}

//component没有变化
@Component
public interface Dagger2PracticeComponent {

    public void inject(Dagger2PracticeActivity dagger2PracticeActivity);
}
```

下面看生成的代码

```java
//根据module生成的对应的工厂类
public final class Dagger2PracticeModel_Factory implements Factory<Dagger2PracticeModel> {
  @Override
  public Dagger2PracticeModel get() {
    return newInstance();
  }

  public static Dagger2PracticeModel_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static Dagger2PracticeModel newInstance() {
    return new Dagger2PracticeModel();
  }

  private static final class InstanceHolder {
    private static final Dagger2PracticeModel_Factory INSTANCE = new Dagger2PracticeModel_Factory();
  }
}




//component类
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private DaggerDagger2PracticeComponent() {

  }

  public static Builder builder() {
    return new Builder();
  }

  public static Dagger2PracticeComponent create() {
    return new Builder().build();
  }

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    return instance;
  }

  public static final class Builder {
    private Builder() {
    }

    public Dagger2PracticeComponent build() {
      return new DaggerDagger2PracticeComponent();
    }
  }
}




//专门注入的类
public final class Dagger2PracticeActivity_MembersInjector implements MembersInjector<Dagger2PracticeActivity> {
  private final Provider<Dagger2PracticeModel> dagger2PracticeModelProvider;

  public Dagger2PracticeActivity_MembersInjector(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider) {
    this.dagger2PracticeModelProvider = dagger2PracticeModelProvider;
  }

  public static MembersInjector<Dagger2PracticeActivity> create(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider) {
    return new Dagger2PracticeActivity_MembersInjector(dagger2PracticeModelProvider);}

  @Override
  public void injectMembers(Dagger2PracticeActivity instance) {
    injectDagger2PracticeModel(instance, dagger2PracticeModelProvider.get());
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.Dagger2PracticeModel")
  public static void injectDagger2PracticeModel(Dagger2PracticeActivity instance,
      Dagger2PracticeModel Dagger2PracticeModel) {
    instance.Dagger2PracticeModel = Dagger2PracticeModel;
  }
}
```

先看看工厂这个工厂是实现了一个接口的

```java
public interface Provider<T> {

    T get();
}


public interface Factory<T> extends Provider<T> {
}
```

- 工厂类只做了两件事
  
  1. 创建module
  
  2. 持有工厂对象

- DaggerDagger2PracticeComponent的改变在于inject的方法
  
     1.直接new了一个对象进行赋值，目前的工厂并没有奏效

# @Inject下面来注入两个一样类型的对象试试

```java
public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel;
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        findViewById(R.id.tv_inject).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_inject:
                Toast.makeText(Dagger2PracticeActivity.this,""+Dagger2PracticeModel+"--"+Dagger2PracticeModel2,Toast.LENGTH_SHORT).show();
                break;
        }
    }
}
```

变化很小，只是用了两个@Inject注入一样类型的两个字段

生成的代码

```java
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private DaggerDagger2PracticeComponent() {

  }

  public static Builder builder() {
    return new Builder();
  }

  public static Dagger2PracticeComponent create() {
    return new Builder().build();
  }

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    return instance;
  }

  public static final class Builder {
    private Builder() {
    }

    public Dagger2PracticeComponent build() {
      return new DaggerDagger2PracticeComponent();
    }
  }
}




public final class Dagger2PracticeActivity_MembersInjector implements MembersInjector<Dagger2PracticeActivity> {
  private final Provider<Dagger2PracticeModel> dagger2PracticeModelProvider;

  private final Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider;

  public Dagger2PracticeActivity_MembersInjector(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider,
      Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider) {
    this.dagger2PracticeModelProvider = dagger2PracticeModelProvider;
    this.dagger2PracticeModel2Provider = dagger2PracticeModel2Provider;
  }

  public static MembersInjector<Dagger2PracticeActivity> create(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider,
      Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider) {
    return new Dagger2PracticeActivity_MembersInjector(dagger2PracticeModelProvider, dagger2PracticeModel2Provider);}

  @Override
  public void injectMembers(Dagger2PracticeActivity instance) {
    injectDagger2PracticeModel(instance, dagger2PracticeModelProvider.get());
    injectDagger2PracticeModel2(instance, dagger2PracticeModel2Provider.get());
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.Dagger2PracticeModel")
  public static void injectDagger2PracticeModel(Dagger2PracticeActivity instance,
      Dagger2PracticeModel Dagger2PracticeModel) {
    instance.Dagger2PracticeModel = Dagger2PracticeModel;
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.Dagger2PracticeModel2")
  public static void injectDagger2PracticeModel2(Dagger2PracticeActivity instance,
      Dagger2PracticeModel Dagger2PracticeModel2) {
    instance.Dagger2PracticeModel2 = Dagger2PracticeModel2;
  }
}
```

变化不大，只是使用两个方法，两次new进行赋值了

# @Provider传递参数

##### 基础场景：通过  @Module 显式提供参数，适合固定或配置型参数。

- 首先明确一点，dagger2标题提供对象的方法有两个，一个是@Inject，还有一个是@Provider

- 使用@Inject方法的呢就是使用构造方法入参的，使用@Provider的呢，就是使用@Provider这个方法入参的，首先这个要明确

- Component里面有啥，有build方法，有我们传入进去的activity【需要被处理】的对象

- **根据之前的逻辑都是new了@Inject的构造参数进行构造的，那么@Provider，可以知道都是使用@Provider这个参数进行构造的，如果需要传递参数给@Provider创建的对象，那么是不是得先传递给Module，然后Module写了@Provider的方法进行创建对象，这里的对象需要传递参数，那么需要Module持有参数先，那么就需要重写Component--Build，并且传递一个Module进去，这样才能达到传递参数的效果是吧**
  
  #基于这个明确，传递参数的先不看，先看使用Provider提供对象的方法
  
  # @Provider注入对象

```java
public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel;

    @Inject
    Dagger2PracticeModel Dagger2PracticeModel2;
    @Inject
    NormalBean normalBean;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
//        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        DaggerDagger2PracticeComponent.builder().build().inject(this);
        findViewById(R.id.tv_inject).setOnClickListener(this);
        findViewById(R.id.tv_inject2).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_inject:
                Toast.makeText(Dagger2PracticeActivity.this,""+Dagger2PracticeModel+"--"+Dagger2PracticeModel2,Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject2:
                Toast.makeText(Dagger2PracticeActivity.this,normalBean+"",Toast.LENGTH_SHORT).show();
                break;
        }
    }
}


@Component(modules = DynamicParamModule.class) //注入这个界面的某些对象，需要外部传递参数
public interface Dagger2PracticeComponent {

    public void inject(Dagger2PracticeActivity dagger2PracticeActivity);
}




@Module
public class DynamicParamModule {

    //配置了参数
    private String dynamicValue;


    @Provides
    NormalBean providerNormalBean(){
        return new NormalBean();
    }
}
```

下面来看生成的代码

需要明确会生成那些代码

- @Inject会生成工厂

- @Provider是一个class，按道理不会生成一个对应的类了

- component的inject方法，会生成一个类，给这个对象注入对象，new或者根据provider来生成对象

- component是一个接口会生成

总结：按道理会生成三个component对应桥梁，@provider【不生成】@inject生成工厂，inject方法传入的对象的@inject会生成一个进行注入
所以按道理是生成三个

- 【@Inject的方式生成对象】，Providder不生成这个类是给component持有的
- component
- 根据传入的对象生成一个注入

所以下面来看生成的代码，provider的方式

```java
//component
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static Dagger2PracticeComponent create() {
    return new Builder().build();
  }

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    return instance;
  }

  public static final class Builder {
    private DynamicParamModule dynamicParamModule;

    private Builder() {
    }

    public Builder dynamicParamModule(DynamicParamModule dynamicParamModule) {
      this.dynamicParamModule = Preconditions.checkNotNull(dynamicParamModule);
      return this;
    }

    public Dagger2PracticeComponent build() {
      if (dynamicParamModule == null) {
        this.dynamicParamModule = new DynamicParamModule();
      }
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}



//inject方法
public final class Dagger2PracticeActivity_MembersInjector implements MembersInjector<Dagger2PracticeActivity> {
  private final Provider<Dagger2PracticeModel> dagger2PracticeModelProvider;

  private final Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider;

  private final Provider<NormalBean> normalBeanProvider;

  public Dagger2PracticeActivity_MembersInjector(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider,
      Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider,
      Provider<NormalBean> normalBeanProvider) {
    this.dagger2PracticeModelProvider = dagger2PracticeModelProvider;
    this.dagger2PracticeModel2Provider = dagger2PracticeModel2Provider;
    this.normalBeanProvider = normalBeanProvider;
  }

  public static MembersInjector<Dagger2PracticeActivity> create(
      Provider<Dagger2PracticeModel> dagger2PracticeModelProvider,
      Provider<Dagger2PracticeModel> dagger2PracticeModel2Provider,
      Provider<NormalBean> normalBeanProvider) {
    return new Dagger2PracticeActivity_MembersInjector(dagger2PracticeModelProvider, dagger2PracticeModel2Provider, normalBeanProvider);}

  @Override
  public void injectMembers(Dagger2PracticeActivity instance) {
    injectDagger2PracticeModel(instance, dagger2PracticeModelProvider.get());
    injectDagger2PracticeModel2(instance, dagger2PracticeModel2Provider.get());
    injectNormalBean(instance, normalBeanProvider.get());
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.Dagger2PracticeModel")
  public static void injectDagger2PracticeModel(Dagger2PracticeActivity instance,
      Dagger2PracticeModel Dagger2PracticeModel) {
    instance.Dagger2PracticeModel = Dagger2PracticeModel;
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.Dagger2PracticeModel2")
  public static void injectDagger2PracticeModel2(Dagger2PracticeActivity instance,
      Dagger2PracticeModel Dagger2PracticeModel2) {
    instance.Dagger2PracticeModel2 = Dagger2PracticeModel2;
  }

  @InjectedFieldSignature("me.jessyan.mvparms.demo.mvp.ui.activity.Dagger2PracticeActivity.normalBean")
  public static void injectNormalBean(Dagger2PracticeActivity instance, NormalBean normalBean) {
    instance.normalBean = normalBean;
  }
}


//@Provider的工厂
public final class DynamicParamModule_ProviderNormalBeanFactory implements Factory<NormalBean> {
  private final DynamicParamModule module;

  public DynamicParamModule_ProviderNormalBeanFactory(DynamicParamModule module) {
    this.module = module;
  }

  @Override
  public NormalBean get() {
    return providerNormalBean(module);
  }

  public static DynamicParamModule_ProviderNormalBeanFactory create(DynamicParamModule module) {
    return new DynamicParamModule_ProviderNormalBeanFactory(module);
  }

  public static NormalBean providerNormalBean(DynamicParamModule instance) {
    return Preconditions.checkNotNull(instance.providerNormalBean(), "Cannot return null from a non-@Nullable @Provides method");
  }
}
```

==还是生成三个的，和我之前预想的不一致

component的build变了，持有了DynamicParamModule，并且这个module最终传递给component，component也持有了module

注入的时候主要调用了这行代码

```java
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
```

Dagger2PracticeActivity_MembersInjector这个类没啥好看的，instance是我们的activity

```java
 DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule)
 //这里传入了dynamicParamModule的函数，这里实则也是调用了provider的方法，只是多了一层封装
```

# 怎么给注入对象传入参数

根据上面的代码知道@Inject的构造方法是不可以传递参数
@Provider这里的创建对象也无法从activity层次传入参数

那么怎么办呢，是否可以先给module传递参数，然后再module通过@Provider创建对象的时候传递参数的时候塞进去呢

答案是可以的，module的对象是通过component的build来创建的，所以我们需要自定义build才行，dagger2中也提供了对应的注解让我们自定义build的这个类

下面看看例子

```java
public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel;

    @Inject
    Dagger2PracticeModel Dagger2PracticeModel2;
    @Inject
    NormalBean normalBean;
    @Inject
    DynamicParamBean dynamicParamBean; //测试给这个bean注入参数

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
//        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        //TODO 这里给module传递了参数
        DaggerDagger2PracticeComponent.builder().dynamicParamModule(new DynamicParamModule("test")).build().inject(this);
        findViewById(R.id.tv_inject).setOnClickListener(this);
        findViewById(R.id.tv_inject2).setOnClickListener(this);
        findViewById(R.id.tv_inject3).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_inject:
                Toast.makeText(Dagger2PracticeActivity.this,""+Dagger2PracticeModel+"--"+Dagger2PracticeModel2,Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject2:
                Toast.makeText(Dagger2PracticeActivity.this,normalBean+"",Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject3:
                Toast.makeText(Dagger2PracticeActivity.this,dynamicParamBean.getConfig(),Toast.LENGTH_SHORT).show();
                break;
        }
    }
}




@Component(modules = DynamicParamModule.class) //注入这个界面的某些对象，需要外部传递参数
public interface Dagger2PracticeComponent {

    public void inject(Dagger2PracticeActivity dagger2PracticeActivity);

    //自定义build。
    @Component.Builder
    interface Builder {
        //配置动态参数
        Builder dynamicParamModule(DynamicParamModule module);  // 自定义 Builder
        //build返回对象，这个方法必须写的
        Dagger2PracticeComponent build();
    }
}



@Module
public class DynamicParamModule {

    //配置了参数
    private String dynamicValue;

    //构造方法
    public DynamicParamModule(String value) { this.dynamicValue = value; }

    //写一个方法，自己new一个对象
    @Provides
    DynamicParamBean provideDynamicObject() {
        return new DynamicParamBean(dynamicValue);
    }
    @Provides
    NormalBean providerNormalBean(){
        return new NormalBean();
    }
}
```

下面来看看生成的代码

```java
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}


public final class DynamicParamModule_ProvideDynamicObjectFactory implements Factory<DynamicParamBean> {
  private final DynamicParamModule module;

  public DynamicParamModule_ProvideDynamicObjectFactory(DynamicParamModule module) {
    this.module = module;
  }

  @Override
  public DynamicParamBean get() {
    return provideDynamicObject(module);
  }

  public static DynamicParamModule_ProvideDynamicObjectFactory create(DynamicParamModule module) {
    return new DynamicParamModule_ProvideDynamicObjectFactory(module);
  }

  public static DynamicParamBean provideDynamicObject(DynamicParamModule instance) {
    return Preconditions.checkNotNull(instance.provideDynamicObject(), "Cannot return null from a non-@Nullable @Provides method");
  }
}
```

可以看到

- 只要是生成对象的都会有一个工厂，不管是@Inject还是@Provider的对象

- Build是可以自定义的，可以传入自己的参数，这个对象会被build持有，

- 最终注入的时候，会使用下面的代码进行注入

```java
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
```

所以完成了传参这样的效果

# @Inject自动解析注入依赖对象

```java
public class StuentBean {

    @Inject
    public StuentBean() {
    }
}


public class TeacherBean {
    StuentBean stuentBean;
    @Inject
    public TeacherBean(StuentBean stuentBean) {
        this.stuentBean = stuentBean;
    }

    public StuentBean getStuentBean() {
        return stuentBean;
    }
}


public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {
    @Inject
    Dagger2PracticeModel Dagger2PracticeModel;

    @Inject
    Dagger2PracticeModel Dagger2PracticeModel2;
    @Inject
    NormalBean normalBean;
    @Inject
    DynamicParamBean dynamicParamBean; //测试给这个bean注入参数

    @Inject
    TeacherBean teacherBean;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
//        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        //TODO 这里给module传递了参数
        DaggerDagger2PracticeComponent.builder().dynamicParamModule(new DynamicParamModule("test")).build().inject(this);
        findViewById(R.id.tv_inject).setOnClickListener(this);
        findViewById(R.id.tv_inject2).setOnClickListener(this);
        findViewById(R.id.tv_inject3).setOnClickListener(this);
        findViewById(R.id.tv_inject4).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_inject:
                Toast.makeText(Dagger2PracticeActivity.this,""+Dagger2PracticeModel+"--"+Dagger2PracticeModel2,Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject2:
                Toast.makeText(Dagger2PracticeActivity.this,normalBean+"",Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject3:
                Toast.makeText(Dagger2PracticeActivity.this,dynamicParamBean.getConfig(),Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_inject4:
                Toast.makeText(Dagger2PracticeActivity.this,teacherBean+"--"+teacherBean.getStuentBean(),Toast.LENGTH_SHORT).show();
                break;
        }
    }
}
```

下面来看生成的代码

```java
public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  private TeacherBean getTeacherBean() {
    return new TeacherBean(new StuentBean());}

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}






//两个工厂

public final class StuentBean_Factory implements Factory<StuentBean> {
  @Override
  public StuentBean get() {
    return newInstance();
  }

  public static StuentBean_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static StuentBean newInstance() {
    return new StuentBean();
  }

  private static final class InstanceHolder {
    private static final StuentBean_Factory INSTANCE = new StuentBean_Factory();
  }
}




public final class TeacherBean_Factory implements Factory<TeacherBean> {
  private final Provider<StuentBean> stuentBeanProvider;

  public TeacherBean_Factory(Provider<StuentBean> stuentBeanProvider) {
    this.stuentBeanProvider = stuentBeanProvider;
  }

  @Override
  public TeacherBean get() {
    return newInstance(stuentBeanProvider.get());
  }

  public static TeacherBean_Factory create(Provider<StuentBean> stuentBeanProvider) {
    return new TeacherBean_Factory(stuentBeanProvider);
  }

  public static TeacherBean newInstance(StuentBean stuentBean) {
    return new TeacherBean(stuentBean);
  }
}
```

可以看到比较重要的就是

```java
  private TeacherBean getTeacherBean() {
    return new TeacherBean(new StuentBean());}



Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
```

总结：@Inject会生成对象工厂，@Provider会生产对象工厂

而component中的inject，注入方法，取决于你的界面有多少个需要注入的对象

- 使用@Inject注入的，会生成工厂但是不使用，这个@Inject是根据对象生成工厂的

- @Provider是根据方法生成工厂的

- Provider有参数，那么可以自定义bulid注入参数

- 如果是@Inject自动解析注入参数，直接生成一个get方法，new了多个对象

并且可以知道调用build是在创建build对象，可以入参，一直到inject的时候才会完整真正的注入操作

# @Inject字段注入

```java
public class TeacherBean {

    StuentBean stuentBean;

    @Inject
    StudentBean2 studentBean2; //不在构造方法注入
    @Inject
    public TeacherBean(StuentBean stuentBean) {
        this.stuentBean = stuentBean;
    }


    public StuentBean getStuentBean() {
        return stuentBean;
    }


    public StudentBean2 getStudentBean2() {
        return studentBean2;
    }
}


public class StudentBean2 {

    @Inject
    public StudentBean2() {
    }
}
```

生成的代码

```java
public final class StudentBean2_Factory implements Factory<StudentBean2> {
  @Override
  public StudentBean2 get() {
    return newInstance();
  }

  public static StudentBean2_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static StudentBean2 newInstance() {
    return new StudentBean2();
  }

  private static final class InstanceHolder {
    private static final StudentBean2_Factory INSTANCE = new StudentBean2_Factory();
  }
}



public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  private TeacherBean getTeacherBean() {
    return injectTeacherBean(TeacherBean_Factory.newInstance(new StuentBean()));}

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private TeacherBean injectTeacherBean(TeacherBean instance) {
    TeacherBean_MembersInjector.injectStudentBean2(instance, new StudentBean2());
    return instance;
  }

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}
```

注意这里和之前的区别是啥呢？

之前基本都是一层注入，或者在构造方法注入

这里是多层注入了

怎么处理的呢？

```java
  private TeacherBean getTeacherBean() {
    return injectTeacherBean(TeacherBean_Factory.newInstance(new StuentBean()));}
//首先看到这里的，这里使用了工厂注入StuentBean()



  //然后进行 这里是字段注入
  private TeacherBean injectTeacherBean(TeacherBean instance) {
    TeacherBean_MembersInjector.injectStudentBean2(instance, new StudentBean2());
    return instance;
  }

      Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
//最后注入到我们的界面中
```

总结：首先不管三七二十一，@Inject和@Provider的方法先生成工厂

所有需要被注入到activity的对象都在component中准备好，最后进行Inject注入

其中build是拿来接收参数的

# @Bind使用

这个@Bind是使用在@Module中的，可以替代@Provider的注解，@Provider主要是注入对应的对象，但是如果在代码中想使用抽象类和接口接收，在@Module中怎么注入实际的对象呢

```java
public interface InterfaceCallBack {

    public String test();
}



public class CallBackImpl implements InterfaceCallBack{

    @Inject
    public CallBackImpl() {
    }

    @Override
    public String test() {
        return "test";
    }
}




@Module
public abstract class BindModule {

    //既然使用@Binds，那么Module也要是抽象的才行
    @Binds
    abstract InterfaceCallBack bindCallBackImpl(CallBackImpl impl);

}



@Component(modules = {DynamicParamModule.class, BindModule.class}) //注入这个界面的某些对象，需要外部传递参数
public interface Dagger2PracticeComponent {

    public void inject(Dagger2PracticeActivity dagger2PracticeActivity);

    //自定义build。
    @Component.Builder
    interface Builder {
        //配置动态参数
        Builder dynamicParamModule(DynamicParamModule module);  // 自定义 Builder
        //build返回对象，这个方法必须写的
        Dagger2PracticeComponent build();
    }
}





public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {

    @Inject
    InterfaceCallBack interfaceCallBack; //抽象和实际的绑定

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
        DaggerDagger2PracticeComponent.builder().dynamicParamModule(new DynamicParamModule("test")).build().inject(this);

        findViewById(R.id.tv_inject6).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){

            case R.id.tv_inject6:
                Toast.makeText(Dagger2PracticeActivity.this,interfaceCallBack+"--"+interfaceCallBack.test(),Toast.LENGTH_SHORT).show();
                break;
        }
    }
}
```

生成的代码

```java
public final class CallBackImpl_Factory implements Factory<CallBackImpl> {
  @Override
  public CallBackImpl get() {
    return newInstance();
  }

  public static CallBackImpl_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CallBackImpl newInstance() {
    return new CallBackImpl();
  }

  private static final class InstanceHolder {
    private static final CallBackImpl_Factory INSTANCE = new CallBackImpl_Factory();
  }
}



public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  private TeacherBean getTeacherBean() {
    return injectTeacherBean(TeacherBean_Factory.newInstance(new StuentBean()));}

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private TeacherBean injectTeacherBean(TeacherBean instance) {
    TeacherBean_MembersInjector.injectStudentBean2(instance, new StudentBean2());
    return instance;
  }

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
    Dagger2PracticeActivity_MembersInjector.injectInterfaceCallBack(instance, new CallBackImpl());
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}
```

大概look了一下，貌似抽象的BindModuel并没有生成啥代码，只是在注入对象的时候new了一个对象进去，这个抽象方法估计只是定义了一种规则，这种规则用于生成代码

# @Binds和 @Named【@Qualifier】 结合实现抽象多绑定

```java
public class CallBackImpl2 implements InterfaceCallBack{

    @Inject
    public CallBackImpl2() {
    }

    @Override
    public String test() {
        return "test2";
    }
}



@Module
public abstract class BindModule {
    //既然使用@Binds，那么Module也要是抽象的才行
    @Binds
    @Named("impl1")
    abstract InterfaceCallBack bindCallBackImpl(CallBackImpl impl);
    @Binds
    @Named("impl2")
    //这里得方法名不能喝上面的方法名一模一样
    abstract InterfaceCallBack bindCallBackImpl2(CallBackImpl2 impl);
}




public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {

    @Inject
    @Named("impl1")
    InterfaceCallBack interfaceCallBack; //抽象和实际的绑定
    @Inject
    @Named("impl2")
    InterfaceCallBack interfaceCallBack2; //抽象和实际的绑定

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);
//        DaggerDagger2PracticeComponent.create().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
//        DaggerDagger2PracticeComponent.builder().build().inject(this);
        //TODO 这里给module传递了参数
        DaggerDagger2PracticeComponent.builder().dynamicParamModule(new DynamicParamModule("test")).build().inject(this);

        findViewById(R.id.tv_inject7).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){

            case R.id.tv_inject7:
                Toast.makeText(Dagger2PracticeActivity.this,interfaceCallBack.test()+"----"+interfaceCallBack2.test(),Toast.LENGTH_SHORT).show();
                break;
        }
    }
}
```

生成的代码

```java
public final class CallBackImpl2_Factory implements Factory<CallBackImpl2> {
  @Override
  public CallBackImpl2 get() {
    return newInstance();
  }

  public static CallBackImpl2_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static CallBackImpl2 newInstance() {
    return new CallBackImpl2();
  }

  private static final class InstanceHolder {
    private static final CallBackImpl2_Factory INSTANCE = new CallBackImpl2_Factory();
  }
}




public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  private TeacherBean getTeacherBean() {
    return injectTeacherBean(TeacherBean_Factory.newInstance(new StuentBean()));}

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private TeacherBean injectTeacherBean(TeacherBean instance) {
    TeacherBean_MembersInjector.injectStudentBean2(instance, new StudentBean2());
    return instance;
  }

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
    Dagger2PracticeActivity_MembersInjector.injectInterfaceCallBack(instance, new CallBackImpl());
    Dagger2PracticeActivity_MembersInjector.injectInterfaceCallBack2(instance, new CallBackImpl2());
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}
```

这里不做总结，都是自己new的对象

# dagger2 中lazy关键字

lazy在调用get才会初始化，后续每次get都复用

```java
public class LazyBean {

    @Inject
    public LazyBean() {
    }
}



public class Dagger2PracticeActivity extends AppCompatActivity implements View.OnClickListener {

    @Inject
    Lazy<LazyBean> lazybean;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_practice);

        DaggerDagger2PracticeComponent.builder().dynamicParamModule(new DynamicParamModule("test")).build().inject(this);

        findViewById(R.id.tv_inject8).setOnClickListener(this);
    }
    @Override
    public void onClick(View view) {
        switch (view.getId()){

            case R.id.tv_inject8:
                Toast.makeText(Dagger2PracticeActivity.this,""+lazybean+"----"+lazybean.get(),Toast.LENGTH_SHORT).show();

                break;
        }
    }
}
```

生成的代码

```java
public final class LazyBean_Factory implements Factory<LazyBean> {
  @Override
  public LazyBean get() {
    return newInstance();
  }

  public static LazyBean_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static LazyBean newInstance() {
    return new LazyBean();
  }

  private static final class InstanceHolder {
    private static final LazyBean_Factory INSTANCE = new LazyBean_Factory();
  }
}


public final class DaggerDagger2PracticeComponent implements Dagger2PracticeComponent {
  private final DynamicParamModule dynamicParamModule;

  private DaggerDagger2PracticeComponent(DynamicParamModule dynamicParamModuleParam) {
    this.dynamicParamModule = dynamicParamModuleParam;
  }

  public static Dagger2PracticeComponent.Builder builder() {
    return new Builder();
  }

  private TeacherBean getTeacherBean() {
    return injectTeacherBean(TeacherBean_Factory.newInstance(new StuentBean()));}

  @Override
  public void inject(Dagger2PracticeActivity dagger2PracticeActivity) {
    injectDagger2PracticeActivity(dagger2PracticeActivity);}

  private TeacherBean injectTeacherBean(TeacherBean instance) {
    TeacherBean_MembersInjector.injectStudentBean2(instance, new StudentBean2());
    return instance;
  }

  private Dagger2PracticeActivity injectDagger2PracticeActivity(Dagger2PracticeActivity instance) {
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectDagger2PracticeModel2(instance, new Dagger2PracticeModel());
    Dagger2PracticeActivity_MembersInjector.injectNormalBean(instance, DynamicParamModule_ProviderNormalBeanFactory.providerNormalBean(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectDynamicParamBean(instance, DynamicParamModule_ProvideDynamicObjectFactory.provideDynamicObject(dynamicParamModule));
    Dagger2PracticeActivity_MembersInjector.injectTeacherBean(instance, getTeacherBean());
    Dagger2PracticeActivity_MembersInjector.injectInterfaceCallBack(instance, new CallBackImpl());
    Dagger2PracticeActivity_MembersInjector.injectInterfaceCallBack2(instance, new CallBackImpl2());
    Dagger2PracticeActivity_MembersInjector.injectLazybean(instance, DoubleCheck.lazy(LazyBean_Factory.create()));
    return instance;
  }

  private static final class Builder implements Dagger2PracticeComponent.Builder {
    private DynamicParamModule dynamicParamModule;

    @Override
    public Builder dynamicParamModule(DynamicParamModule module) {
      this.dynamicParamModule = Preconditions.checkNotNull(module);
      return this;
    }

    @Override
    public Dagger2PracticeComponent build() {
      Preconditions.checkBuilderRequirement(dynamicParamModule, DynamicParamModule.class);
      return new DaggerDagger2PracticeComponent(dynamicParamModule);
    }
  }
}
```

总结：
主要代码在这里

```java
    Dagger2PracticeActivity_MembersInjector.injectLazybean(instance, DoubleCheck.lazy(LazyBean_Factory.create()));


    DoubleCheck.lazy这个是啥，并且传递进去的参数是啥，从上面可以看到实则是一个LazyBean_Factory工厂
```

那么看来重点在doubleCheck里面了

```java
public final class DoubleCheck<T> implements Provider<T>, Lazy<T> {
  private static final Object UNINITIALIZED = new Object();

  private volatile Provider<T> provider;
  private volatile Object instance = UNINITIALIZED;
 //私有构造方法
  private DoubleCheck(Provider<T> provider) {
    assert provider != null;
    this.provider = provider;
  }

//实则是get这里才会创建，第一次进入result == UNINITIALIZED
//第一次进入是调用了get方法，
//第二次进入直接返回result
  @SuppressWarnings("unchecked") // cast only happens when result comes from the provider
  @Override
  public T get() {
    Object result = instance;
    if (result == UNINITIALIZED) {
      synchronized (this) {
        result = instance;
        if (result == UNINITIALIZED) {
          result = provider.get();
          instance = reentrantCheck(instance, result);
          /* Null out the reference to the provider. We are never going to need it again, so we
           * can make it eligible for GC. */
          provider = null;
        }
      }
    }
    return (T) result;
  }


  public static Object reentrantCheck(Object currentInstance, Object newInstance) {
    boolean isReentrant = !(currentInstance == UNINITIALIZED
        // This check is needed for fastInit's implementation, which uses MemoizedSentinel types.
        || currentInstance instanceof MemoizedSentinel);

    if (isReentrant && currentInstance != newInstance) {
      throw new IllegalStateException("Scoped provider was invoked recursively returning "
          + "different results: " + currentInstance + " & " + newInstance + ". This is likely "
          + "due to a circular dependency.");
    }
    return newInstance;
  }


  public static <P extends Provider<T>, T> Provider<T> provider(P delegate) {
    checkNotNull(delegate);
    if (delegate instanceof DoubleCheck) {

      return delegate;
    }
    return new DoubleCheck<T>(delegate);
  }

//生成的代码实则回来到这里， return new DoubleCheck<T>(checkNotNull(provider));
//来到构造方法这边
//直接赋予给了private volatile Provider<T> provider;
//并且这个类是实现了Provider，和Lazy的，provider自动注入的对象都已生成工厂，lazy是延迟
  public static <P extends Provider<T>, T> Lazy<T> lazy(P provider) {
    if (provider instanceof Lazy) {
      @SuppressWarnings("unchecked")
      final Lazy<T> lazy = (Lazy<T>) provider;
      return lazy;
    }
    return new DoubleCheck<T>(checkNotNull(provider));
  }
}
```

总结：

lazy<lazyBean>会生成一个工厂类，这个工厂类实现了Provider，所以生成代码第一次注入的时候是走的double的lazy方法，实则返回的是一个doublecheck，这是一个工厂也是一个lazy，可以想到是装饰者模式，然后再get的时候，进行判断初始化变量，或者返回之前的变量，所以activity中的lazy<lazyBean>实则是doubleCheck，并不是LazyBean这个对象，是被包装过的了

# dagger的对象怎么实现单例@Singleton

首先需要明确，使用一般xxxComponent.Inject(xxxx)完成注入，那么既然想让对象单例，首先得确保xxxComponent不会重复创建，而xxxComponent创建一般是由xxxComponent中的build来创建的，@Inject根据之前的事列，每次都会new，@Provider是根据我们Module中的方法来创建对象的，那么怎么实现单例呢？dagger2中有提供 @Singleton，**注解用于在 ​**同一 Component 作用域内实现单例。但需注意：它的生命周期由 Component 实例决定，若 Component 实例不同，单例也会不同

```java
@Singleton
public class TestSingleBean {

    @Inject
    public TestSingleBean() {
    }
}
//@Singleton是啥，一个自定义注解


@Scope
@Documented
@Retention(RUNTIME)
public @interface Singleton {}



public class Dagger2TestSingleActiviyt1 extends AppCompatActivity implements View.OnClickListener {
    @Inject
    TestSingleBean testSingleBean1;
    @Inject
    TestSingleBean testSingleBean2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_test_single_activiyt1);
        DaggerDagger2SingleTestComponent.create().inject(this);
        findViewById(R.id.tv_test1).setOnClickListener(this);
        findViewById(R.id.tv_test2).setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_test1:
                startActivity(new Intent(Dagger2TestSingleActiviyt1.this,Dagger2TestSingleActivity2.class));
                break;
            case R.id.tv_test2:
                Toast.makeText(Dagger2TestSingleActiviyt1.this,""+testSingleBean1+"----"+testSingleBean2,Toast.LENGTH_SHORT).show();
                break;
        }
    }
}


public class Dagger2TestSingleActivity2 extends AppCompatActivity implements View.OnClickListener {

    @Inject
    TestSingleBean testSingleBean1;
    @Inject
    TestSingleBean testSingleBean2;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_test_single2);
        DaggerDagger2SingleTestComponent.create().inject(this);
        findViewById(R.id.tv_test1).setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_test1:
                Toast.makeText(Dagger2TestSingleActivity2.this,""+testSingleBean1+"----"+testSingleBean2,Toast.LENGTH_SHORT).show();
                break;

        }
    }
}



@Singleton
@Component
public interface Dagger2SingleTestComponent {

    public void inject(Dagger2TestSingleActiviyt1 dagger2TestSingleActiviyt1);
    public void inject(Dagger2TestSingleActivity2 dagger2TestSingleActiviyt2);

}
```

生成的代码

```java
   public final class TestSingleBean_Factory implements Factory<TestSingleBean> {
  @Override
  public TestSingleBean get() {
    return newInstance();
  }

  public static TestSingleBean_Factory create() {
    return InstanceHolder.INSTANCE;
  }

  public static TestSingleBean newInstance() {
    return new TestSingleBean();
  }

  private static final class InstanceHolder {
    private static final TestSingleBean_Factory INSTANCE = new TestSingleBean_Factory();
  }
}


  public final class DaggerDagger2SingleTestComponent implements Dagger2SingleTestComponent {
  private Provider<TestSingleBean> testSingleBeanProvider;

  private DaggerDagger2SingleTestComponent() {

    initialize();
  }

  public static Builder builder() {
    return new Builder();
  }

  public static Dagger2SingleTestComponent create() {
    return new Builder().build();
  }

  @SuppressWarnings("unchecked")
  private void initialize() {
    this.testSingleBeanProvider = DoubleCheck.provider(TestSingleBean_Factory.create());
  }

  @Override
  public void inject(Dagger2TestSingleActiviyt1 dagger2TestSingleActiviyt1) {
    injectDagger2TestSingleActiviyt1(dagger2TestSingleActiviyt1);}

  @Override
  public void inject(Dagger2TestSingleActivity2 dagger2TestSingleActiviyt2) {
    injectDagger2TestSingleActivity2(dagger2TestSingleActiviyt2);}

  private Dagger2TestSingleActiviyt1 injectDagger2TestSingleActiviyt1(
      Dagger2TestSingleActiviyt1 instance) {
    Dagger2TestSingleActiviyt1_MembersInjector.injectTestSingleBean1(instance, testSingleBeanProvider.get());
    Dagger2TestSingleActiviyt1_MembersInjector.injectTestSingleBean2(instance, testSingleBeanProvider.get());
    return instance;
  }

  private Dagger2TestSingleActivity2 injectDagger2TestSingleActivity2(
      Dagger2TestSingleActivity2 instance) {
    Dagger2TestSingleActivity2_MembersInjector.injectTestSingleBean1(instance, testSingleBeanProvider.get());
    Dagger2TestSingleActivity2_MembersInjector.injectTestSingleBean2(instance, testSingleBeanProvider.get());
    return instance;
  }

  public static final class Builder {
    private Builder() {
    }

    public Dagger2SingleTestComponent build() {
      return new DaggerDagger2SingleTestComponent();
    }
  }
}
```

  可以看到工厂代码一模一样和之前的，并且这里的保证单例是使用DoubleCheck来实现的，这里不分析了，之前的@Binds和@Named的时候分析过了，所以多次get的时候拿到是一样的，但是跳转界面之后就不一样了，是因为component不一样了，要想多个界面跳转都是一样的，得需要再application下面进行注入才行，这里不写demo额，@Provider的方式也是一样的，保证单列的根本原因是doublecheck

# Component提供一个对象返回

```java
@Singleton
@Component
public interface Dagger2SingleTestComponent {

    public void inject(Dagger2TestSingleActiviyt1 dagger2TestSingleActiviyt1);
    public void inject(Dagger2TestSingleActivity2 dagger2TestSingleActiviyt2);

     //主要是这个方法
    public TestSingleBean testSigleBean();
}





public class Dagger2TestSingleActivity2 extends AppCompatActivity implements View.OnClickListener {

    @Inject
    TestSingleBean testSingleBean1;
    @Inject
    TestSingleBean testSingleBean2;
    Dagger2SingleTestComponent dagger2SingleTestComponent;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dagger2_test_single2);
        dagger2SingleTestComponent = DaggerDagger2SingleTestComponent.create();
        dagger2SingleTestComponent .inject(this);
        findViewById(R.id.tv_test1).setOnClickListener(this);
        findViewById(R.id.tv_test2).setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()){
            case R.id.tv_test1:
                Toast.makeText(Dagger2TestSingleActivity2.this,""+testSingleBean1+"----"+testSingleBean2,Toast.LENGTH_SHORT).show();
                break;
            case R.id.tv_test2: //这里可以获取到一个注入的对象
                Toast.makeText(Dagger2TestSingleActivity2.this,""+dagger2SingleTestComponent.testSigleBean(),Toast.LENGTH_SHORT).show();
                break;

        }
    }
}
```

生成的代码

```java
public final class DaggerDagger2SingleTestComponent implements Dagger2SingleTestComponent {
  private Provider<TestSingleBean> testSingleBeanProvider;

  private DaggerDagger2SingleTestComponent() {

    initialize();
  }

  public static Builder builder() {
    return new Builder();
  }

  public static Dagger2SingleTestComponent create() {
    return new Builder().build();
  }

  @SuppressWarnings("unchecked")
  private void initialize() {
    this.testSingleBeanProvider = DoubleCheck.provider(TestSingleBean_Factory.create());
  }

  @Override
  public void inject(Dagger2TestSingleActiviyt1 dagger2TestSingleActiviyt1) {
    injectDagger2TestSingleActiviyt1(dagger2TestSingleActiviyt1);}

  @Override
  public void inject(Dagger2TestSingleActivity2 dagger2TestSingleActiviyt2) {
    injectDagger2TestSingleActivity2(dagger2TestSingleActiviyt2);}

//这里生成了这个方法
  @Override
  public TestSingleBean testSigleBean() {
    return testSingleBeanProvider.get();}

  private Dagger2TestSingleActiviyt1 injectDagger2TestSingleActiviyt1(
      Dagger2TestSingleActiviyt1 instance) {
    Dagger2TestSingleActiviyt1_MembersInjector.injectTestSingleBean1(instance, testSingleBeanProvider.get());
    Dagger2TestSingleActiviyt1_MembersInjector.injectTestSingleBean2(instance, testSingleBeanProvider.get());
    return instance;
  }

  private Dagger2TestSingleActivity2 injectDagger2TestSingleActivity2(
      Dagger2TestSingleActivity2 instance) {
    Dagger2TestSingleActivity2_MembersInjector.injectTestSingleBean1(instance, testSingleBeanProvider.get());
    Dagger2TestSingleActivity2_MembersInjector.injectTestSingleBean2(instance, testSingleBeanProvider.get());
    return instance;
  }

  public static final class Builder {
    private Builder() {
    }

    public Dagger2SingleTestComponent build() {
      return new DaggerDagger2SingleTestComponent();
    }
  }
}
```







# dagger2的参数只要有对应的对象也是会自动注入的

```java
@Module
public class NetworkModule {
    @Provides
    OkHttpClient provideOkHttpClient(Interceptor interceptor) { // interceptor 由其他 @Provides 提供
        return new OkHttpClient.Builder().addInterceptor(interceptor).build();
    }

    @Provides
    Interceptor provideLoggingInterceptor() {
        return new HttpLoggingInterceptor();
    }
}

//provideOkHttpClient参数Interceptor是会自动使用provideLoggingInterceptor注入的
```

总结dagger2玩来玩去就三个，一个工厂，一个页面【需要注入对象的class】，一个桥梁，当然可以再加一个DoubleCheck，就几个东西。所谓的自动注入，就是在框架帮你new对象，但是你得告诉他，new那些对象，最终这些对象被那些字段持有，难的原因是因为你不知道他在背后默默做了什么，并且不知道他的注解作用是啥，这个框架实则就是注解+apt实现的，每次build的时候都会根据注解生成代码
