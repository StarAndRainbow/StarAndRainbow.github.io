// 定义 Markdown 内容
const markdownContents = {
    "home.md": `# 欢迎来到我的技术博客

这是一个使用 Markdown 编写的技术博客示例。

## 特点

- 支持 Markdown 语法
- 代码高亮
- 响应式设计`,

    "frontend/vue-basics.md": `# Vue.js 基础教程

## Vue.js 简介

Vue.js 是一个渐进式的 JavaScript 框架。

\`\`\`javascript
const app = Vue.createApp({
    data() {
        return {
            message: 'Hello Vue!'
        }
    }
})
\`\`\`
`,

    "frontend/react-guide.md": `# React 入门指南

## React 基础概念

React 是一个用于构建用户界面的 JavaScript 库。

\`\`\`jsx
function Welcome(props) {
    return <h1>Hello, {props.name}</h1>;
}
\`\`\`
`
};

// 菜单配置
menuConfig = {
    "menu": [
        {
            "id": "home",
            "title": "首页介绍",
            "file": "posts/home.md"
        },
        {
            "id": "development",
            "title": "开发技术",
            "children": [
                {
                    "id": "android",
                    "title": "android",
                    "children": [
                        {
                            "id": "custom_view",
                            "title": "view",
                            "file": "posts/view/自定义控件.md"
                        },
                       
                    ]
                }
            ]
        }
    ]
}; 