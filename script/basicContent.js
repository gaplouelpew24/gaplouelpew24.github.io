//布尔变量声明
let initializationClicked = false;
//临时变量
let multiple_buy = 0;

//聊天窗口
let pageWidth = window.innerWidth;
let close = false;

if (pageWidth <= 700) {
    close = true;
    document.getElementById('Chat').style.display = 'none';
}

document.getElementById('Fandom').disabled = true;
document.getElementById('Night').disabled = true;

let x50 = false;
let x5 = false;

//版本号
version = '0.1.8 — 初入后室';
const expBar = document.querySelector('#ExpLevel .ExpBar');

//读取本地数据并加载
const stored = localStorage.getItem('version');

if (stored == null) {
    initialization();
    if (localStorage.getItem('base')) load_saves();
    fading_text("初次加载成功", "green");
}
else if ((stored.replace(/^"(.*)"$/, '$1')).substring(0, 3) == version.substring(0, 3) || (stored.replace(/^"(.*)"$/, '$1')).substring(0, 3) != version.substring(0, 3)) {
    initialization();
    load_saves();
    fading_text("本地存档加载成功", "green");
}
else {
    initialization();
    if (localStorage.getItem('base')) load_saves();
    fading_text("加载出现错误", "red");
}

function load_saves() {
    base = { ...base, ...JSON.parse(localStorage.getItem('base'))};
    level = { ...level, ...JSON.parse(localStorage.getItem('level'))};
    speed = { ...speed, ...JSON.parse(localStorage.getItem('speed'))};
    exp = { ...exp, ...JSON.parse(localStorage.getItem('exp'))};
    moneyneed = { ...moneyneed, ...JSON.parse(localStorage.getItem('moneyneed'))};
}

//点击事件
function basic_click_event(name, button, secname){
    switch (name){
    //点击后修改bar的颜色
    case "changebarcolor":
        const bar = button.querySelector('.bar');
        if(secname == "entity") {button.style.filter = "brightness(1.7)";}
        else if (bar) {
            bar.style.backgroundColor = "rgba(var(--red),.5)";
            button.style.filter = "brightness(.7)";
        }
        //恢复原色
        setTimeout(() => {
        bar.style.backgroundColor = '';
        button.style.filter = '';
        }, 100);
        return;

    //侧栏开关
    case "toggleleftbar":
        const leftBar = document.getElementById('LeftBar');
        const closeBar = document.getElementById('CloseLeftBar');
        if (leftBar.style.left == '-10rem') {
            leftBar.style.left = '0';
            closeBar.style.display = 'unset';
        } 
        else {
            leftBar.style.left = '-10rem';
            closeBar.style.display = 'none';
        }
        return;

    //初始化
    case "initialization": 
        if (!initializationClicked) {
            button.textContent = '确定？';
            initializationClicked = true;
        }
        else {
            initialization();
            button.textContent = '初始化';
            initializationClicked = false;
            fading_text("初始化成功", "green");
        }
        return;

    //关闭公告栏
    case "closenotice":
        document.getElementById('Notice').classList.add('close');
        return;

    //隐藏聊天块
    case "hidechat":
        if (!close) {
            document.getElementById('Chat').style.display = 'none';
            close = !close;
        }
        else {
            document.getElementById('Chat').style.display = '';
            close = !close;
        }
        return;
    
    //刷新
    case 'reload':
        location.reload();
        return;

    //将聊天窗口归到原位
    case "homing":
        let dragItem = document.getElementById('ChatBlock');
        dragItem.style.transform = "translate3d(0,0,0)";
        xOffset = 0;
        yOffset = 0;
        return;

    //导出存档
    case "save":
        export_save();
        return;

    //导入存档
    case "load":
        import_save(button);
        return;

    }

    if(secname == "rcm") document.getElementById('RightClickMenu').style.display = 'none';
};

//上方弹出文字
function fading_text(content, color){
    var fadingText = document.createElement('div');
    fadingText.classList.add('fadingText');

    var customText = content;
    fadingText.textContent = customText;

    var customColor = color;
    fadingText.style.color = "rgb(var(--" + customColor + "))";

    document.body.appendChild(fadingText);

    setTimeout(function() {
        fadingText.remove();
    }, 3000);
}

//鼠标移入移出事件
function mouse_event(name, button){
    if (name == "initialization") {
        button.textContent = '初始化';
        initializationClicked = false;
    }
}

//升级后才会显示的内容
function upgrade_visiable() {
    const showButtons = (selector, level) => {
        const targetButtons = document.querySelectorAll(selector);
        targetButtons.forEach(btn => {
            // 获取类名中的 .level 后面的数字部分
            const digit = parseInt(btn.className.match(/\d+/)[0]);
            
            btn.style.display = level >= digit ? 'flex' : 'none';
        });
    };

    showButtons('.basement.level1, .basement.level2', level.managementLevel.basement);
    showButtons('.explorer.level1', level.managementLevel.explorer);
}

//保存本地数据
function local_storage(){
    localStorage.setItem('version', JSON.stringify(version));
    localStorage.setItem('base', JSON.stringify(base));
    localStorage.setItem('level', JSON.stringify(level));
    localStorage.setItem('speed', JSON.stringify(speed));
    localStorage.setItem('exp', JSON.stringify(exp));
    localStorage.setItem('moneyneed', JSON.stringify(moneyneed));
}

//玩家等级
function player_level(){
    if (exp.currentExp >= exp.maxExp){
        exp.currentExp -= exp.maxExp;
        exp.currentLevel ++;
    }
}

//初始化与变量储存位置
function initialization(){
    varibales();
    max_level();
    entity_system();
}

//分页
const buttons = document.querySelectorAll('button[id^="Left"]');
const divs = document.querySelectorAll('div[id^="C"]');

buttons.forEach(button => {
    button.addEventListener('click', function() {
        buttons.forEach(btn => {
            btn.classList.remove('select');
        });
        this.classList.add('select');

        divs.forEach(div => {
            if (div.id.startsWith('C')) {
                    div.style.display = 'none';
                }
            });

        const targetDivId = this.id.replace('Left', 'C');
        const targetDiv = document.getElementById(targetDivId);
        if (targetDiv) {
            targetDiv.style.display = 'unset';
        }
    });
});

//按键检测
document.addEventListener('keydown', function(event) {
    if (event.key == 'Shift') {
        x50 = true;
    }
    if (event.key == 'Control') {
        x5 = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key == 'Shift') {
        x50 = false;
    }
    if (event.key == 'Control') {
        x5 = false;
    }
});

function pressdown_display() {
    const pressButtons = document.querySelectorAll('[class*=press-button]:not([class*=click])');

    if (x50 && !x5)
    pressButtons.forEach(button => {
        button.classList.add('leftShiftPressed');
    });

    if (!x50)
    pressButtons.forEach(button => {
        button.classList.remove('leftShiftPressed');
    });

    if (x5 && !x50)
    pressButtons.forEach(button => {
        button.classList.add('leftCtrlPressed');
    });

    if (!x5)
    pressButtons.forEach(button => {
        button.classList.remove('leftCtrlPressed');
    });
}

//单位换算
function format_number(num, aw) {

    if (aw) {
        if (num < 1000) {return num.toFixed(2) + ' 毫';} 
        else if (num < 10000000) {return (num / 1000).toFixed(2) + ' ';}
        else if (num < 100000000000) {return (num / 10000000).toFixed(4) + ' 万';}
        else {return (num / 100000000000).toFixed(4) + ' 亿';}
    }
    else {
        if (num < 10000) {return num.toFixed(0) + ' ';} 
        else if (num < 100000000) {return (num / 10000).toFixed(2) + ' 万';}
        else if (num < 1000000000000) {return (num / 100000000).toFixed(4) + ' 亿';}
        else {return (num / 1000000000000).toFixed(4) + ' 兆';}
    }
}

//导出存档
function export_save() {
    const data = JSON.stringify({ version, base, level, speed, exp, moneyneed });

    const a = document.createElement('a');
    const file = new Blob([data], { type: 'application/file' });
    a.href = URL.createObjectURL(file);
    a.download = 'save.gp';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

//导入存档
function import_save(button) {
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const content = event.target.result;
                    const importedData = JSON.parse(content);

                    //Object.assign(version, importedData.version);
                    //导入的变量
                    base = { ...base, ...importedData.base};
                    level = { ...level, ...importedData.level};
                    speed = { ...speed, ...importedData.speed};
                    exp = { ...exp, ...importedData.exp};
                    moneyneed = { ...moneyneed, ...importedData.moneyneed};

                    console.log('变量已导入:', base, level, speed, exp, moneyneed);

                    button.style.backgroundColor = "rgba(var(--green),.5)";
                    fading_text("导入成功", "green");

                    setTimeout(() => {
                        button.style.backgroundColor = '';
                    }, 500);
                } catch (error) {
                    console.error('导入失败:', error.message);

                    button.style.backgroundColor = "rgba(var(--red),.5)";
                    fading_text("导入失败：" + error.message, "red");

                    setTimeout(() => {
                        button.style.backgroundColor = '';
                    }, 500);
                }
            };
            reader.readAsText(file);
        }
    });
    input.click();
    entity_system();
}

//设定最高等级
function max_level(){
    level.searchLevel.maxAlmondWater = 5000;
    level.increaseLevel.maxWanderer = 5000;
    level.managementLevel.maxBasement = 10;
    level.managementLevel.maxExplorer = 1;
}

//切换版式
function change_theme(name) {
    if (name == "Fandom")
    {
        if (document.getElementById('Fandom').disabled) {
            document.getElementById('Fandom').disabled = false;
        } else {
            document.getElementById('Fandom').disabled = true;
        }
    }
    if (name == "Night")
    {
        if (document.getElementById('Night').disabled) {
            document.getElementById('Night').disabled = false;
        } else {
            document.getElementById('Night').disabled = true;
        }
    }
}

//右键菜单
document.addEventListener('contextmenu', function (e) {
    var menu = document.getElementById('RightClickMenu');
    menu.style.display = 'block';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
});

document.addEventListener('click', function () {
    document.getElementById('RightClickMenu').style.display = 'none';
});