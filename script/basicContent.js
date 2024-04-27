console.log('从零开始建立后室基地\n作者：GaplouelPew\n游戏版本：v0.0.1');

        //基础变量声明
        let base, level, speed, exp, moneyneed;
        //布尔变量声明
        let initializationClicked = false;

        //读取本地数据并加载
        const storedBase = localStorage.getItem('base');
        if (!storedBase) initialization();
        else {
            base = JSON.parse(localStorage.getItem('base'));
            level = JSON.parse(localStorage.getItem('level'));
            speed = JSON.parse(localStorage.getItem('speed'));
            exp = JSON.parse(localStorage.getItem('exp'));
            moneyneed = JSON.parse(localStorage.getItem('moneyneed'));
        }

        const expBar = document.querySelector('#ExpLevel .ExpBar');

        setInterval(update, 0);
        setInterval(get_almondwater_exp, 10)

        //点击事件
        function click_event(name, button, secname){
            //搜寻
            if (name == "search"){
                //杏仁水
                if (secname == "AM") {
                base.almondWater += 1 + Math.pow((level.searchLevel.almondWater - 1) / 2, 2);
                exp.currentExp += 1 + Math.pow((level.searchLevel.almondWater - 1) / 4, 2);
                }
                return;
            }
            //购买
            if (name == "buy"){
                if (secname == "Wanderer") {
                    if (x5 && base.almondWater >= moneyneed.buy.wandererx5) {
                        base.almondWater -= moneyneed.buy.wandererx5;
                        base.wanderer += 5;
                        return;
                    }
                    else if (x50 && base.almondWater >= moneyneed.buy.wandererx50) {
                        base.almondWater -= moneyneed.buy.wandererx50;
                        base.wanderer += 50;
                        return;
                    }
                    else if (!x5 && !x50 && base.almondWater >= moneyneed.buy.wanderer) {
                        base.almondWater -= moneyneed.buy.wanderer;
                        base.wanderer ++;
                        return;
                    }
                }

                button.style.backgroundColor = "rgba(var(--red),.5)";
                setTimeout(() => {
                    button.style.backgroundColor = '';
                    }, 100);
            }
            //等级升级
            if (name == "upgrade"){
                //杏仁水搜寻
                if (secname == "SearchAM") {
                    if (x5 && base.almondWater >= moneyneed.upgrade.search.almondWaterx5) {
                        base.almondWater -= moneyneed.upgrade.search.almondWaterx5;
                        level.searchLevel.almondWater += 5;
                        return;
                    }
                    else if (x50 && base.almondWater >= moneyneed.upgrade.search.almondWaterx50) {
                        base.almondWater -= moneyneed.upgrade.search.almondWaterx50;
                        level.searchLevel.almondWater += 50;
                        return;
                    }
                    else if (!x5 && !x50 && base.almondWater >= moneyneed.upgrade.search.almondWater) {
                        base.almondWater -= moneyneed.upgrade.search.almondWater;
                        level.searchLevel.almondWater ++;
                        return;
                    }
                }
                //基地升级
                if (secname == "Basement") {
                    if (x5 && base.almondWater >= moneyneed.upgrade.management.basement.moneyx5 && base.wanderer >= moneyneed.upgrade.management.basement.wandererx5) {
                        base.almondWater -= moneyneed.upgrade.management.basement.moneyx5;
                        level.managementLevel.basement += 5;
                        return;
                    }
                    else if (x50 && base.almondWater >= moneyneed.upgrade.management.basement.moneyx50 && base.wanderer >= moneyneed.upgrade.management.basement.wandererx50) {
                        base.almondWater -= moneyneed.upgrade.management.basement.moneyx50;
                        level.managementLevel.basement += 50;
                        return;
                    }
                    else if (!x5 && !x50 && base.almondWater >= moneyneed.upgrade.management.basement.money && base.wanderer >= moneyneed.upgrade.management.basement.wanderer) {
                        base.almondWater -= moneyneed.upgrade.management.basement.money;
                        level.managementLevel.basement ++;
                        return;
                    }
                }
                //流浪者升级
                if (secname == "Wanderer") {
                    if (x5 && base.almondWater >= moneyneed.upgrade.increase.wandererx5) {
                        base.almondWater -= moneyneed.upgrade.increase.wandererx5;
                        level.increaseLevel.wanderer += 5;
                        return;
                    }
                    else if (x50 && base.almondWater >= moneyneed.upgrade.increase.wandererx50) {
                        base.almondWater -= moneyneed.upgrade.increase.wandererx50;
                        level.increaseLevel.wanderer += 50;
                        return;
                    }
                    else if (!x5 && !x50 && base.almondWater >= moneyneed.upgrade.increase.wanderer) {
                        base.almondWater -= moneyneed.upgrade.increase.wanderer;
                        level.increaseLevel.wanderer ++;
                        return;
                    }
                }

                button.style.backgroundColor = "rgba(var(--red),.5)";
                setTimeout(() => {
                    button.style.backgroundColor = '';
                    }, 100);
            }

            //点击后修改bar的颜色
            if (name == "changebarcolor") {
                const bar = button.querySelector('.bar');
                if (bar) {
                    bar.style.backgroundColor = "rgba(var(--red),.5)";

                    //恢复原色
                    setTimeout(() => {
                    bar.style.backgroundColor = '';
                    }, 100);
                }
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
                }
                return;
            }
        };

        //鼠标移入移出事件
        function mouse_event(name, button){
            if (name == "initialization") {
                button.textContent = '初始化';
                initializationClicked = false;
            }
        }
        
        //更新
        function update(){
            level_and_speed();
            local_storage();
            player_level();
            money_need();
            upgrade_visiable();
            pressdown_display();

            //杏仁水获取速度
            base.speed = speed.wandererSpeed;

            exp.maxExp = Math.pow(exp.currentLevel, 3) * 50;
            expBar.style.setProperty('--expbar-startpoint', (exp.currentExp / exp.maxExp) * 100 + '%');

            display_values();
        };

        //升级后才会显示的内容
        function upgrade_visiable(){
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
        }

        //更新数值显示
        function display_values(){
            //上方最基本的数值
            document.getElementById('AlmondWater').textContent = formatNumber(base.almondWater, true);
            document.getElementById('Wanderers').textContent = formatNumber(base.wanderer, false);
            document.getElementById('Speed').textContent = formatNumber((base.speed / 10), true);

            //上方等级
            document.getElementById('PlLevel').textContent = formatNumber(exp.currentLevel, false);
            document.getElementById('PlExp').textContent = formatNumber(exp.currentExp, false);
            document.getElementById('PlMaxExp').textContent = formatNumber(exp.maxExp, false);

            //搜寻杏仁水相关数值
            document.getElementById('AmSearchLv').textContent = formatNumber(level.searchLevel.almondWater, false);
            document.getElementById('EfficiencySearchAM').textContent = formatNumber((1 + Math.pow((level.searchLevel.almondWater - 1) / 2, 2)), true);


            //基地升级
            document.getElementById('BasementLv').textContent = formatNumber(level.managementLevel.basement, false);


            //流浪者相关数值
            document.getElementById('WandererLv').textContent = formatNumber(level.increaseLevel.wanderer, false);
            document.getElementById('EfficiencyIncreaseWanderer').textContent = formatNumber((speed.wandererSpeed / 10), true);

            //购买金额
            if(x5) {
                document.getElementById('BasementLvUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.moneyx5, true);
                document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWaterx5, true);
                document.getElementById('BasementWandererUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.wandererx5, false);
                document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wandererx5, true);
                document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wandererx5, true);
            }
            else if(x50) {
                document.getElementById('BasementLvUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.moneyx50, true);
                document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWaterx50, true);
                document.getElementById('BasementWandererUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.wandererx50, false);
                document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wandererx50, true);
                document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wandererx50, true);
            }
            else {
                document.getElementById('BasementLvUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.money, true);
                document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWater, true);
                document.getElementById('BasementWandererUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.wanderer, false);
                document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wanderer, true);
                document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wanderer, true);
            }
        }

        //保存本地数据
        function local_storage(){
            localStorage.setItem('base', JSON.stringify(base));
            localStorage.setItem('level', JSON.stringify(level));
            localStorage.setItem('speed', JSON.stringify(speed));
            localStorage.setItem('exp', JSON.stringify(exp));
            localStorage.setItem('moneyneed', JSON.stringify(moneyneed));
        }

        //获取杏仁水与经验的速度
        function get_almondwater_exp(){
            base.almondWater += base.speed / 1000;
            exp.currentExp += base.speed / 100;
        }

        //等级与速度
        function level_and_speed(){
            speed.wandererSpeed = base.wanderer *(1 + ((level.increaseLevel.wanderer - 1) / 10));
        }

        //玩家等级
        function player_level(){
            if (exp.currentExp >= exp.maxExp){
                exp.currentExp -= exp.maxExp;
                exp.currentLevel ++;
            }
        }

        //所需金额
        function money_need(){
            moneyneed.upgrade.search.almondWaterx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.search.almondWaterx5 += Math.pow(level.searchLevel.almondWater + i, 2) * 20;}
            moneyneed.upgrade.search.almondWaterx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.search.almondWaterx50 += Math.pow(level.searchLevel.almondWater + i, 2) * 20;}
            moneyneed.upgrade.search.almondWater = Math.pow(level.searchLevel.almondWater, 2) * 20;

            moneyneed.upgrade.increase.wandererx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.increase.wandererx5 += Math.pow(level.increaseLevel.wanderer + i, 2) * 50;}
            moneyneed.upgrade.increase.wandererx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.increase.wandererx50 += Math.pow(level.increaseLevel.wanderer + i, 2) * 50;}
            moneyneed.upgrade.increase.wanderer = Math.pow(level.increaseLevel.wanderer, 2) * 50;

            moneyneed.upgrade.management.basement.moneyx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.management.basement.moneyx5 += Math.pow(level.managementLevel.basement + i + 1, 3.5) * 50;}
            moneyneed.upgrade.management.basement.moneyx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.management.basement.moneyx50 += Math.pow(level.managementLevel.basement + i + 1, 3.5) * 50;}
            moneyneed.upgrade.management.basement.money = Math.pow(level.managementLevel.basement + 1, 3.5) * 50;

            moneyneed.upgrade.management.basement.wandererx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.management.basement.wandererx5 += Math.pow(level.managementLevel.basement + i, 2) * 100;}
            moneyneed.upgrade.management.basement.wandererx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.management.basement.wandererx50 += Math.pow(level.managementLevel.basement + i, 2) * 100;}
            moneyneed.upgrade.management.basement.wanderer = Math.pow(level.managementLevel.basement, 2) * 100;

            moneyneed.buy.wandererx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.buy.wandererx5 += Math.pow(1.2, base.wanderer + i) * 10;}
            moneyneed.buy.wandererx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.buy.wandererx50 += Math.pow(1.2, base.wanderer + i) * 10;}
            moneyneed.buy.wanderer = Math.pow(1.2, base.wanderer) * 10;
        }

        //初始化
        function initialization(){
            base = {
                almondWater: 0,
                wanderer: 0,
                speed: 0,
            };

            level = {
                searchLevel: {
                    almondWater: 1,
                },
                increaseLevel: {
                    wanderer: 1,
                },
                managementLevel: {
                    basement: 0,
                }
            };

            speed = {
                wandererSpeed: 0,
            };

            exp = {
                currentLevel: 0,
                currentExp: 0,
                maxExp: 0,
            };

            moneyneed = {
                upgrade: {
                    search: {
                        almondWater: 0,
                        almondWaterx5: 0,
                        almondWaterx50: 0,
                    },
                    increase: {
                        wanderer: 0,
                        wandererx5: 0,
                        wandererx50: 0,
                    },
                    management: {
                        basement: {
                            money: 0,
                            moneyx5: 0,
                            moneyx50: 0,
                            wanderer: 0,
                            wandererx5: 0,
                            wandererx50: 0,
                        },
                    },
                },
                buy: {
                    wanderer: 0,
                    wandererx5: 0,
                    wandererx50: 0,
                }
            };
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
        function formatNumber(num, aw) {

            if (aw) {
                if (num < 1000) {return num.toFixed(2) + ' 毫';} 
                else if (num < 10000000) {return (num / 1000).toFixed(2) + ' ';}
                else if (num < 100000000000) {return (num / 10000000).toFixed(4) + ' 万';}
                else {return (num / 100000000000).toFixed(4) + ' 亿';}
            }
            else {
                if (num < 10000) {return num.toFixed(0) + ' ';} 
                else if (num < 100000000) {return (num / 1000).toFixed(2) + ' 万';}
                else if (num < 1000000000000) {return (num / 10000000).toFixed(4) + ' 亿';}
                else {return (num / 1000000000000).toFixed(4) + ' 亿';}
            }
        }

        //导出存档
        function export_save() {
            const data = JSON.stringify({ base, level, speed, exp, moneyneed });

            const a = document.createElement('a');
            const file = new Blob([data], { type: 'application/file' });
            a.href = URL.createObjectURL(file);
            a.download = 'save';
            
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
                            Object.assign(base, importedData.base);
                            Object.assign(level, importedData.level);
                            Object.assign(speed, importedData.speed);
                            Object.assign(exp, importedData.exp);
                            Object.assign(moneyneed, importedData.moneyneed);
                            console.log('变量已导入:', base, level, speed, exp, moneyneed);

                            button.style.backgroundColor = "rgba(var(--green),.5)";

                            setTimeout(() => {
                                button.style.backgroundColor = '';
                            }, 500);
                        } catch (error) {
                            console.error('导入失败:', error.message);

                            button.style.backgroundColor = "rgba(var(--red),.5)";

                            setTimeout(() => {
                                button.style.backgroundColor = '';
                            }, 500);
                        }
                    };
                    reader.readAsText(file);
                }
            });
            input.click();
        }