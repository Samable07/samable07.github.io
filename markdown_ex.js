// 以下属于自制的 Markdown 语法，可能并不兼容原版

// 下划线 _text_
function underline() {
    return {
        extensions: [{
            name: 'underline',
            level: 'inline', // 行内元素
            start(src) { return src.indexOf('_'); }, //  查找下划线位置
            tokenizer(src, tokens) {
                // 定义匹配下划线文本的正则表达式：
                // ^_       - 以下划线开头
                // ([^_]+)  - 捕获组，匹配一个或多个非下划线字符
                // _        - 以下划线结尾
                const rule = /^_([^_]+)_/;
                const match = rule.exec(src); // 匹配正则
                if (match) {
                    return {
                        type: 'underline',
                        raw: match[0], // 原始文本
                        text: match[1] // 提取去掉下划线的文本
                    };
                }
            },
            renderer(token) {
                return `<u>${token.text}</u>`; // 输出去掉下划线的文本
            }
        }]
    };
}
marked.use(underline());

// 卡片  [[类型|text]] （类型有：warning、info、danger）（|前后的空格无所谓）
marked.setOptions({ breaks: false, gfm: true }); // 初始化防BUG
function card() {
    return{
        extensions: [{
            name: 'card',
            level: 'block',
            start(src) { return src.trimStart().startsWith('[[') ? 0 : undefined; },
            tokenizer(src) {
                const match = src.match(/^\[\[\s*(.*?)\s*\|\s*([\s\S]*?)\s*\]\]/);
                if (match) {
                    return {
                        type: "card", // 重要！修了半天原来是这段被删掉了，无语
                        raw: match[0],
                        card_type: match[1],
                        content: match[2]
                    };
                }
            },
            renderer(token) {
                // 要解析卡片里的markdown，用marked.parse()
                return `
                <div class="custom-card custom-card-${token.card_type}">
                    <div>${marked.parse(token.content)}</div> 
                </div>
                `;
            }
        }]
    }
}
marked.use(card());

// 图片重写
marked.setOptions({ breaks: true, gfm: true }); // 初始化防BUG
function image() {
    return {
        extensions: [{
            name: 'image',
            level: 'inline',
            start(src) { return src.indexOf('!['); },
            tokenizer(src, tokens) {
                const rule = /^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/; // 匹配 ![alt](src "title")
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'image',
                        raw: match[0],
                        alt: match[1],
                        href: match[2],
                        title: match[3] || ''
                    };
                }
            },
            renderer(token) {
                // 自定义图片结构（带滚动容器）
                return `
                    <div class="img-scroll-container" style="overflow-x: auto;">
                        <img src="${token.href}" alt="${token.alt}" 
                            style="display: block; min-width: min-content; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
                            ${token.title ? `title="${token.title}"` : ''}
                            loading="lazy">
                    </div>
                    <p style="text-align: center; color: #8b8b8bff;">${token.alt}</p>
                `;
            }
        }]
    };
}
marked.use(image());

// codebox
marked.setOptions({ breaks: true, gfm: true }); // 初始化防BUG
function codeBox() {
    return {
        extensions: [{
            name: 'codeBox',
            level: 'block',
            start(src) { 
                return src.trimStart().startsWith('```') ? 0 : undefined;
            },
            tokenizer(src, tokens) {
                // 支持三种格式：
                // 1. ```lang [title]
                // 2. ```lang
                // 3. ```
                const rule = /^```([^\s\[\]]*)(?:\s+\[([^\]]+)\])?\n([\s\S]*?)\n```/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'codeBox',
                        raw: match[0],
                        lang: match[1] || 'text',
                        title: match[2] || '',
                        code: match[3].trim()
                    };
                }
            },
            renderer(token) {
                // HTML转义函数
                const escape = (html) => html
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                const highlightComments = (code) => {
                    // 匹配注释
                    if(token.lang=='python'){
                    commentRegex = /(?<!#.*)(#.*$)|('''[\s\S]*?'''|"""[\s\S]*?""")/g;
                    }else{
                    commentRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
                    }
                    // 将注释用span包裹并添加class
                    return code.replace(commentRegex, '<span class="comment">$1</span>');
                };
                // 构建输出结构
                return `
                <div class="code-box">
                    ${token.title ? `
                    <div class="code-box-header">
                        <span class="code-title">${escape(token.title)}</span>
                        <span class="code-lang">${escape(token.lang)}</span>
                    </div>` : ''}
                    <pre class="code-content">${highlightComments(escape(token.code))}</pre>
                </div>
                `.trim();
            }
        }]
    };
}
marked.use(codeBox());