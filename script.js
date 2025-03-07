document.addEventListener('DOMContentLoaded', function() {
    // 配置 marked 选项
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return code;
        }
    });

    generateMenu(menuConfig.menu);
    initializeMenuEvents();
    
    // 默认加载首页
    loadMarkdownContent('posts/home.md');
});

function generateMenu(menuData) {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = '';
    
    menuData.forEach(item => {
        if (item.id === 'home') {
            const homeItem = document.createElement('li');
            homeItem.setAttribute('data-page', item.id);
            homeItem.setAttribute('data-file', item.file);
            homeItem.className = 'active';
            homeItem.textContent = item.title;
            navMenu.appendChild(homeItem);
        } else {
            const section = document.createElement('li');
            section.className = 'nav-section collapsed';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'section-title';
            titleDiv.innerHTML = `
                <span>${item.title}</span>
                <i class="arrow"></i>
            `;
            
            const subMenu = document.createElement('ul');
            subMenu.className = 'sub-menu';
            
            item.children.forEach(child => {
                const subItem = document.createElement('li');
                subItem.setAttribute('data-page', child.id);
                subItem.setAttribute('data-file', child.file);
                subItem.textContent = child.title;
                subMenu.appendChild(subItem);
            });
            
            section.appendChild(titleDiv);
            section.appendChild(subMenu);
            navMenu.appendChild(section);
        }
    });
}

function initializeMenuEvents() {
    const menuItems = document.querySelectorAll('.sidebar li[data-page]');
    const sections = document.querySelectorAll('.nav-section');

    // 处理一级菜单的点击事件
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        title.addEventListener('click', (e) => {
            e.stopPropagation();
            sections.forEach(s => {
                if (s !== section) s.classList.add('collapsed');
            });
            section.classList.toggle('collapsed');
        });
    });

    // 处理菜单项的点击事件
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const parentSection = this.closest('.nav-section');
            if (parentSection) {
                parentSection.classList.remove('collapsed');
            }

            const filePath = this.getAttribute('data-file');
            loadMarkdownContent(filePath);
        });
    });
}

// 加载并渲染 Markdown 内容
function loadMarkdownContent(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('文章不存在');
            }
            return response.text();
        })
        .then(markdown => {
            const html = marked.parse(markdown);
            document.getElementById('main-content').innerHTML = `
                <div class="article-container">
                    ${html}
                </div>
            `;
            // 代码高亮
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        })
        .catch(error => {
            document.getElementById('main-content').innerHTML = `
                <div class="article-container error">
                    <h2>加载失败</h2>
                    <p>${error.message}</p>
                </div>
            `;
        });
} 