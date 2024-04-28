        //布尔变量声明
        let initializationClicked = false;
        //临时变量
        let multiple_buy = 0;
        //版本号
        version = '0.1.1 — 初入后室';

        //读取本地数据并加载
        const stored = localStorage.getItem('version').replace(/^"(.*)"$/, '$1');
        if (!stored) {
            initialization();
        }
        else if (stored.substring(0, 3) != version.substring(0, 3)) {
            initialization();
            fading_text("本地存档加载失败，已初始化");
        }
        else {
            initialization();
            base = JSON.parse(localStorage.getItem('base'));
            level = JSON.parse(localStorage.getItem('level'));
            speed = JSON.parse(localStorage.getItem('speed'));
            exp = JSON.parse(localStorage.getItem('exp'));
            moneyneed = JSON.parse(localStorage.getItem('moneyneed'));
            fading_text("本地存档加载成功");
        }

        const expBar = document.querySelector('#ExpLevel .ExpBar');

        //点击事件
        function basic_click_event(name, button, secname){
            //点击后修改bar的颜色
            if (name == "changebarcolor") {
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
            }

            //侧栏开关
            if (name == "toggleleftbar") {
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
            }

            //初始化
            if (name == "initialization") {
                if (!initializationClicked) {
                    button.textContent = '确定？';
                    initializationClicked = true;
                }
                else {
                    initialization();
                    button.textContent = '初始化';
                    initializationClicked = false;
                    location.reload();
                }
                return;
            }

            //关闭公告栏
            if (name == "closenotice") {
                document.getElementById('Notice').classList.add('close');
                return;
            }
        };

        function fading_text(content){
            var fadingText = document.createElement('div');
            fadingText.classList.add('fadingText');

            var customText = content;
            fadingText.textContent = customText;

            document.body.appendChild(fadingText);

            setTimeout(function() {
                fadingText.style.opacity = 0;
            }, 5000);
        }

        //鼠标移入移出事件
        function mouse_event(name, button){
            if (name == "initialization") {
                button.textContent = '初始化';
                initializationClicked = false;
            }
        }

        //升级后才会显示的内容
        /*function upgrade_visiable(){
            const BaseButtonLv1 = document.querySelectorAll('.basement.level1');

            buttons.forEach(button => {
                if (level.managementLevel.basement >= 1) {
                    BaseButtonLv1.forEach(btn => {
                        btn.style.display = 'flex';
                    });
                } else {
                    BaseButtonLv1.forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
            });

            const ExplorerButtonLv1 = document.querySelectorAll('.explorer.level1');

            buttons.forEach(button => {
                if (level.managementLevel.explorer >= 1) {
                    ExplorerButtonLv1.forEach(btn => {
                        btn.style.display = 'flex';
                    });
                } else {
                    ExplorerButtonLv1.forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
            });
        }*/
        function upgrade_visiable() {
            const showButtons = (selector, level) => {
                const targetButtons = document.querySelectorAll(selector);
                targetButtons.forEach(btn => {
                    btn.style.display = level >= 1 ? 'flex' : 'none';
                });
            };
        
            showButtons('.basement.level1', level.managementLevel.basement);
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

        //随机数
        function get_random_int(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}

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

        let x50 = false;
        let x5 = false;

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

                            if (importedData.version.substring(0, 3) != version.substring(0, 3)) {
                                throw new Error('导入的存档版本与当前版本不兼容');
                            }

                            //Object.assign(version, importedData.version);
                            Object.assign(base, importedData.base);
                            Object.assign(level, importedData.level);
                            Object.assign(speed, importedData.speed);
                            Object.assign(exp, importedData.exp);
                            Object.assign(moneyneed, importedData.moneyneed);
                            console.log('变量已导入:', base, level, speed, exp, moneyneed);

                            button.style.backgroundColor = "rgba(var(--green),.5)";
                            fading_text("导入成功");
                            location.reload();

                            setTimeout(() => {
                                button.style.backgroundColor = '';
                            }, 500);
                        } catch (error) {
                            console.error('导入失败:', error.message);

                            button.style.backgroundColor = "rgba(var(--red),.5)";
                            fading_text("导入失败：" + error.message, true);

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

        entity_system();