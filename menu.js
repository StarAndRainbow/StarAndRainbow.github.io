// 菜单配置
menuConfig = {
    "menu": [
        {
            "id": "home",
            "title": "首页介绍",
            "file": "posts/home.md"
        },
        {
            "id": "android",
            "title": "android开发",
            "children": [
                {
                    "id": "lifecycler",
                    "title": "lifecycler",
                    "file": "posts/view/lifecycle原理.md"
                },
                 {
                     "id": "fragment1",
                     "title": "fragment怎么被activity管理的",
                     "file": "posts/view/fragment怎么被activity管理的.md"
                },
            ],
        },
        {
            "id": "library",
            "title": "库",
            "children": [
                {
                    "id": "dagger2",
                    "title": "dagger2",
                    "file": "posts/view/dagger2用法.md"
                }
            ],

        },

    ]
};