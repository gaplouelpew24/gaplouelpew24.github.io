const API = "http://101.42.15.243:8081/api";
const curUser = () => JSON.parse(localStorage.getItem('user'));

//图片转Base64
function getBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

//帖子列表
async function loadHomePosts() {
    const res = await fetch(`${API}/posts`);
    const posts = await res.json();
    const list = document.getElementById('list');
    if (!list) return;
    list.innerHTML = posts.map(p => `
        <div class="card">
            <div class="card-main">
                <div class="title"><a href="post.html?id=${p.id}">${p.title}</a></div>
                <div class="meta">${p.author.nickname} | ${p.time}</div>
                <div class="brief">${p.content.substring(0, 50)}...</div>
            </div>
        </div>
    `).join('');
}

//发帖
async function doSubmitPost() {
    const user = curUser();
    if (!user) return alert("请先登录");
    const imgFile = document.getElementById('p_file').files[0];
    const data = {
        title: document.getElementById('p_title').value,
        content: document.getElementById('p_content').value,
        authorId: user.id,
        authorNick: user.nickname,
        authorAvatar: user.avatar,
        image: imgFile ? await getBase64(imgFile) : null
    };
    await fetch(`${API}/posts`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    location.reload();
}

//帖子详情与回帖
async function loadPostDetail() {
    const pid = new URLSearchParams(location.search).get('id');
    const res = await fetch(`${API}/posts/${pid}`);
    const p = await res.json();
    
    document.getElementById('post_area').innerHTML = `
        <div class="card main-floor">
            <h2>${p.title}</h2>
            <p>${p.content}</p>
            ${p.image ? `<img src="${p.image}" style="max-width:100%">` : ''}
            <div class="meta">楼主：${p.authorNick} 发布于 ${p.time}</div>
        </div>
        ${p.replies.map((r, i) => `
            <div class="card reply-floor">
                <div class="meta">${i + 1}楼 | ${r.authorNick} | ${r.time}</div>
                <p>${r.content}</p>
            </div>
        `).join('')}
    `;
}

async function doReply() {
    const user = curUser();
    const pid = new URLSearchParams(location.search).get('id');
    const content = document.getElementById('r_content').value;
    await fetch(`${API}/posts/reply`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ postId: pid, content, authorNick: user.nickname, authorAvatar: user.avatar }) 
    });
    location.reload();
}

//后台
async function loadAdminBoard() {
    const res = await fetch(`${API}/admin/all`);
    const data = await res.json();
    
    document.getElementById('user_table').innerHTML = data.users.map(u => `
        <tr><td>${u.username}</td><td>${u.nickname}</td><td><button onclick="adminDelUser('${u.id}')">注销</button></td></tr>
    `).join('');

    document.getElementById('post_table').innerHTML = data.posts.map(p => `
        <tr><td>${p.title}</td><td>${p.authorNick}</td><td><button onclick="adminDelPost('${p.id}')">删除</button></td></tr>
    `).join('');
}

function adminGuard() {
    const u = curUser();
    if (!u || !u.isAdmin) {
        alert("权限不足，请以管理员身份登录！");
        location.href = 'index.html';
    }
}

//登录
async function authAction(type) {
    const username = document.getElementById('user')?.value;
    const password = document.getElementById('pwd')?.value;
    const nickname = document.getElementById('nick')?.value;
    const avatar = document.getElementById('avatar_preview')?.src;

    if (type === 'register') {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password, nickname, avatar })
        });
        if (res.ok) { alert('注册成功'); location.href='login.html'; }
    } else {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            location.href = 'index.html';
        } else alert('登录失败');
    }
}

//帖子操作
async function fetchPosts() {
    const res = await fetch(`${API}/posts`);
    const posts = await res.json();
    const container = document.getElementById('post-list');
    if (!container) return;
    
    container.innerHTML = posts.map(p => `
        <div style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:8px; background:white;">
            <div style="display:flex; align-items:center; margin-bottom:10px;">
                <img src="${p.author.avatar}" style="width:40px; height:40px; border-radius:50%; margin-right:10px;">
                <strong>${p.author.nickname}</strong>
                <span style="color:#888; font-size:12px; margin-left:10px;">${p.time}</span>
            </div>
            <h3 style="margin:5px 0;"><a href="post.html?id=${p.id}" style="text-decoration:none; color:#333;">${p.title}</a></h3>
            <p style="color:#666;">${p.content.substring(0, 50)}...</p>
            ${getLocalUser()?.id === p.author.id ? `<button onclick="deleteMyPost('${p.id}')" style="color:red; border:none; background:none; cursor:pointer;">删除</button>` : ''}
        </div>
    `).join('');
}

async function submitPost() {
    const user = getLocalUser();
    if (!user) return alert('请先登录');
    const title = document.getElementById('p_title').value;
    const content = document.getElementById('p_content').value;
    const image = document.getElementById('p_img_preview')?.src;

    await fetch(`${API}/posts`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title, content, image, author: user })
    });
    location.reload();
}

async function deleteMyPost(id) {
    if (!confirm('确定删除吗？')) return;
    await fetch(`${API}/posts/${id}`, { method: 'DELETE' });
    location.reload();
}

//回复
async function submitReply() {
    const user = getLocalUser();
    if (!user) {
        alert("请先登录后再回帖");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    const content = document.getElementById('r_content').value.trim();
    if (!content) {
        alert("回复内容不能为空");
        return;
    }

    const replyData = {
        postId: postId,
        content: content,
        authorId: user.id,
        authorNick: user.nickname,
        authorAvatar: user.avatar
    };

    try {
        const response = await fetch(`${API}/posts/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(replyData)
        });

        if (response.ok) {
            alert("回复成功！");
            document.getElementById('r_content').value = ''; // 清空输入框
            location.reload(); // 刷新页面查看新楼层
        } else {
            alert("回复失败，请重试");
        }
    } catch (err) {
        console.error("回帖请求出错:", err);
        alert("网络错误，请稍后再试");
    }
}

//详情页加载
async function loadDetail() {
    const pid = new URLSearchParams(location.search).get('id');
    const res = await fetch(`${API}/posts`);
    const posts = await res.json();
    const post = posts.find(p => p.id === pid);
    if (!post) return;

    const user = getLocalUser();
    const isAuthor = user && user.id === post.author.id;

    document.getElementById('post-content').innerHTML = `
        <div style="background:white; padding:20px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1 style="margin:0;">${post.title}</h1>
                ${isAuthor ? `
                    <button
                        onclick="deletePostFromDetail('${post.id}')"
                        style="color:#dc3545; border:none; background:none; cursor:pointer; font-size:14px;">
                        删除帖子
                    </button>
                ` : ''}
            </div>

            <div style="display:flex; align-items:center; margin:15px 0;">
                <img src="${post.author.avatar}" style="width:50px; border-radius:50%;">
                <div style="margin-left:10px;">
                    <b>${post.author.nickname}</b><br>
                    <small>${post.time}</small>
                </div>
            </div>

            <p style="line-height:1.6;">${post.content}</p>
            ${post.image ? `<img src="${post.image}" style="max-width:100%; margin-top:10px;">` : ''}
        </div>

        <div style="margin-top:20px;">
            <h4>回复 (${post.replies.length})</h4>
            ${post.replies.map(r => `
                <div style="border-bottom:1px solid #eee; padding:10px 0;">
                    <img src="${r.author.avatar}" style="width:30px; border-radius:50%; vertical-align:middle;">
                    <b>${r.author.nickname}</b>: ${r.content}
                    <small style="color:#999">(${r.time})</small>
                </div>
            `).join('')}
        </div>
    `;
}

//个人资料修改
async function updateProfile() {
    const user = getLocalUser();
    const updated = {
        id: user.id,
        nickname: document.getElementById('nick').value,
        avatar: document.getElementById('avatar_preview').src,
        password: document.getElementById('pwd').value || user.password
    };
    const res = await fetch(`${API}/user/update`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updated)
    });
    const data = await res.json();
    if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('修改成功');
        location.href = 'index.html';
    }
}

//基础函数
function getLocalUser() {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
        return JSON.parse(userData);
    } catch (e) {
        console.error("解析用户信息失败", e);
        return null;
    }
}

function logout() {
    localStorage.removeItem('user');
    alert("已退出登录");
    location.href = 'index.html';
}

function adminGuard() {
    const user = getLocalUser();
    if (!user || user.isAdmin !== true) {
        alert("对不起，该页面仅限管理员访问！");
        location.href = 'index.html';
    }
}