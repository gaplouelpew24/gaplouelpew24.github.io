console.log('从零开始建立后室基地\n作者：GaplouelPew\n游戏版本：v0.0.1');

        //基础变量声明
        let base, level, speed, exp, moneyneed;
        //布尔变量声明
        let initializationClicked = false;

        //读取本地数据并加载
        const stored = localStorage.getItem('level');
        if (!stored) {
            initialization();
        }
        else {
            initialization();
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
                if (secname == "Wanderer" && base.wanderer < base.maxWanderer) {
                    if (x5 && base.almondWater >= moneyneed.buy.wandererx5 && base.wanderer + 5 < base.maxWanderer) {
                        base.almondWater -= moneyneed.buy.wandererx5;
                        base.wanderer += 5;
                        return;
                    }
                    else if (x50 && base.almondWater >= moneyneed.buy.wandererx50 && base.wanderer + 50 < base.maxWanderer) {
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
                //杏仁水搜寻升级
                if (secname == "SearchAM" && level.searchLevel.almondWater < level.searchLevel.maxAlmondWater) {
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
                if (secname == "Basement" && level.managementLevel.basement < level.managementLevel.maxBasement) {
                    if (base.almondWater >= moneyneed.upgrade.management.basement.money && base.wanderer >= moneyneed.upgrade.management.basement.wanderer) {
                        base.almondWater -= moneyneed.upgrade.management.basement.money;
                        level.managementLevel.basement ++;
                        return;
                    }
                }
                //探索升级
                if (secname == "Explorer" && level.managementLevel.explorer < level.managementLevel.maxExplorer) {
                    if (base.almondWater >= moneyneed.upgrade.management.explorer.money && exp.currentLevel >= moneyneed.upgrade.management.explorer.level) {
                        base.almondWater -= moneyneed.upgrade.management.explorer.money;
                        level.managementLevel.explorer ++;
                        if (level.managementLevel.explorer <=1) entity_system();
                        return;
                    }
                }
                //流浪者升级
                if (secname == "Wanderer" && level.increaseLevel.wanderer < level.increaseLevel.maxWanderer) {
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

            //打实体
            if (name == "attack") {
                if (secname == "level1") {
                    let randomhurt = getRandomInt(1, 3)
                    entity.level1.hp -= randomhurt;
                    if (entity.level1.hp - randomhurt <= 0){
                        exp.currentExp += entity.level1.exp;
                        fading_text("获得" + entity.level1.exp.toFixed(0) + "经验");
                        entity_system();
                    }
                    return;
                }
            }

            //点击后修改bar的颜色
            if (name == "changebarcolor") {
                const bar = button.querySelector('.bar');
                if(secname == "entity") {button.style.filter = "brightness(1.7)";}
                else if (bar) {
                    bar.style.backgroundColor = "rgba(var(--red),.5)";
                    button.style.filter = "brightness(.7)";
                    //恢复原色
                }
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
        
        //更新
        function update(){
            level_and_speed();
            local_storage();
            player_level();
            money_need();
            upgrade_visiable();
            pressdown_display();

            //杏仁水获取速度
            base.speed = speed.wandererSpeed * 10;

            base.maxWanderer = moneyneed.upgrade.management.basement.wanderer;

            //实体血条
            document.getElementById('Level1EntityHPBar').style.backgroundImage = "linear-gradient(to right,rgb(var(--red)) 0,rgb(var(--red)) "+ (entity.level1.hp / entity.level1.maxHp)*100 +"%,rgba(0,0,0,0) "+ (entity.level1.hp / entity.level1.maxHp)*100 +"%) ";

            exp.maxExp = Math.pow(exp.currentLevel, 1.5) * 100;
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
        }

        //更新数值显示
        function display_values(){
            //实体数值
            document.getElementById('Level1EntityHP').textContent = entity.level1.hp.toFixed(0);
            document.getElementById('Level1EntityMaxHP').textContent = entity.level1.maxHp.toFixed(0);

            //上方最基本的数值
            document.getElementById('AlmondWater').textContent = formatNumber(base.almondWater, true);
            document.getElementById('Wanderers').textContent = formatNumber(base.wanderer, false);
            document.getElementById('MaxWanderers').textContent = formatNumber(base.maxWanderer, false);
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
            if(level.managementLevel.basement >= level.managementLevel.maxBasement){
                document.getElementById('BasementLvUpNeed').textContent = "满级 ";
                document.getElementById('BasementWandererUpNeed').textContent = "满级 ";
            }
            else {
                document.getElementById('BasementLvUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.money, true);
                document.getElementById('BasementWandererUpNeed').textContent = formatNumber(moneyneed.upgrade.management.basement.wanderer, false);
            }

            //探索升级
            document.getElementById('ExplorerLv').textContent = formatNumber(level.managementLevel.explorer, false);
            if(level.managementLevel.explorer >= level.managementLevel.maxExplorer){
                document.getElementById('ExplorerLvUpNeed').textContent = "满级 ";
                document.getElementById('ExplorerLvUpLvNeed').textContent = "满级 ";
            }
            else {
                document.getElementById('ExplorerLvUpNeed').textContent = formatNumber(moneyneed.upgrade.management.explorer.money, true);
                document.getElementById('ExplorerLvUpLvNeed').textContent = formatNumber(moneyneed.upgrade.management.explorer.level, false);
            }

            //流浪者相关数值
            document.getElementById('WandererLv').textContent = formatNumber(level.increaseLevel.wanderer, false);
            document.getElementById('EfficiencyIncreaseWanderer').textContent = !speed.wandererSpeed > 0 ? "1 毫" :formatNumber(((speed.wandererSpeed) / base.wanderer), true);

            //购买金额
            if(x5) {
                if(level.searchLevel.almondWater >= level.searchLevel.maxAlmondWater) document.getElementById('AmSearchLvUpNeed').textContent = "满级 ";
                else document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWaterx5, true);

                if(level.increaseLevel.wanderer >= level.increaseLevel.maxWanderer) document.getElementById('WandererLvUpNeed').textContent = "满级 ";
                else document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wandererx5, true);

                if(base.wanderer >= Math.pow(level.managementLevel.maxBasement, 2) * 40) document.getElementById('BuyWandererNeed').textContent = "满级 ";
                else document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wandererx5, true);
            }
            else if(x50) {
                if(level.searchLevel.almondWater >= level.searchLevel.maxAlmondWater) document.getElementById('AmSearchLvUpNeed').textContent = "满级 ";
                else document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWaterx50, true);

                if(level.increaseLevel.wanderer >= level.increaseLevel.maxWanderer) document.getElementById('WandererLvUpNeed').textContent = "满级 ";
                else document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wandererx50, true);

                if(base.wanderer >= Math.pow(level.managementLevel.maxBasement, 2) * 40) document.getElementById('BuyWandererNeed').textContent = "满级 ";
                else document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wandererx50, true);
            }
            else {
                if(level.searchLevel.almondWater >= level.searchLevel.maxAlmondWater) document.getElementById('AmSearchLvUpNeed').textContent = "满级 ";
                else document.getElementById('AmSearchLvUpNeed').textContent = formatNumber(moneyneed.upgrade.search.almondWater, true);

                if(level.increaseLevel.wanderer >= level.increaseLevel.maxWanderer) document.getElementById('WandererLvUpNeed').textContent = "满级 ";
                else document.getElementById('WandererLvUpNeed').textContent = formatNumber(moneyneed.upgrade.increase.wanderer, true);

                if(base.wanderer >= Math.pow(level.managementLevel.maxBasement, 2) * 40) document.getElementById('BuyWandererNeed').textContent = "满级 ";
                else document.getElementById('BuyWandererNeed').textContent = formatNumber(moneyneed.buy.wanderer, true);
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

        //玩家等级
        function player_level(){
            if (exp.currentExp >= exp.maxExp){
                exp.currentExp -= exp.maxExp;
                exp.currentLevel ++;
            }
        }

        //所需金额
        function money_need(){
            moneyneed.upgrade.management.basement.money = Math.pow((level.managementLevel.basement + 1) * 2 - 1, 8) * 50;
            moneyneed.upgrade.management.basement.wanderer = Math.pow(level.managementLevel.basement, 2) * 40;

            moneyneed.upgrade.management.explorer.money = Math.pow((level.managementLevel.explorer + 2) * 2 - 1, 3) * 500;
            moneyneed.upgrade.management.explorer.level = Math.pow(level.managementLevel.explorer + 1, 2) * 5;

            moneyneed.upgrade.search.almondWaterx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.search.almondWaterx5 += Math.pow(level.searchLevel.almondWater + i, 3) * 20;}
            moneyneed.upgrade.search.almondWaterx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.search.almondWaterx50 += Math.pow(level.searchLevel.almondWater + i, 3) * 20;}
            moneyneed.upgrade.search.almondWater = Math.pow(level.searchLevel.almondWater, 3) * 20;

            moneyneed.upgrade.increase.wandererx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.upgrade.increase.wandererx5 += Math.pow(level.increaseLevel.wanderer + i, 3.1) * 50;}
            moneyneed.upgrade.increase.wandererx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.upgrade.increase.wandererx50 += Math.pow(level.increaseLevel.wanderer + i, 3.1) * 50;}
            moneyneed.upgrade.increase.wanderer = Math.pow(level.increaseLevel.wanderer, 3.1) * 50;

            moneyneed.buy.wandererx5 = 0;
            for (let i = 0; i < 5; i++) {moneyneed.buy.wandererx5 += Math.pow(base.wanderer + i, 2.25) * 10;}
            moneyneed.buy.wandererx50 = 0;
            for (let i = 0; i < 50; i++) {moneyneed.buy.wandererx50 += Math.pow(base.wanderer + i, 2.25) * 10;}
            moneyneed.buy.wanderer = Math.pow(base.wanderer, 2.25) * 10;
        }

        //设定最高等级
        function max_level(){
            level.searchLevel.maxAlmondWater = 5000;
            level.increaseLevel.maxWanderer = 5000;
            level.managementLevel.maxBasement = 10;
            level.managementLevel.maxExplorer = 1;
        }

        //随机数
        function getRandomInt(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}

        //打怪系统
        function entity_system(){
            const Lv1Entities = ["猎犬", "死亡飞蛾", "钝人", "悲尸"];
            let randomLv1Entity = Lv1Entities[Math.floor(Math.random() * Lv1Entities.length)];
            document.getElementById('RandomLevel1Entity').textContent = randomLv1Entity;

            entity.level1.maxHp = (getRandomInt(Math.pow(exp.currentLevel, 2.2), Math.pow(exp.currentLevel, 2.27)) / exp.currentLevel * 1.2);
            entity.level1.hp = entity.level1.maxHp;
            entity.level1.exp = getRandomInt(Math.pow(exp.currentLevel, 2.5), Math.pow(exp.currentLevel, 2.7));
        }

        //初始化与变量储存位置
        function initialization(){
            base = {
                almondWater: 0,
                wanderer: 0,
                maxWanderer: 0,
                speed: 0,
            };

            level = {
                searchLevel: {
                    almondWater: 1,
                    maxAlmondWater: 0,
                },
                increaseLevel: {
                    wanderer: 1,
                    maxWanderer: 1,
                },
                managementLevel: {
                    basement: 0,
                    maxBasement: 0,
                    explorer: 0,
                    maxExplorer: 0,
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
                            wanderer: 0,
                        },
                        explorer: {
                            money: 0,
                            level: 0,
                        },
                    },
                },
                buy: {
                    wanderer: 0,
                    wandererx5: 0,
                    wandererx50: 0,
                }
            };
            
            entity = {
                level1: {
                    hp: 0,
                    maxHp: 0,
                    exp: 0,
                },
            },
            max_level();
            entity_system();
        }

        //获取杏仁水与经验的速度
        function get_almondwater_exp(){
            if (base.speed>0)
            base.almondWater += base.speed / 1000;
            exp.currentExp += base.speed / 10000 / Math.pow(level.increaseLevel.wanderer, 1.75);
        }

        //等级与速度
        function level_and_speed(){
            speed.wandererSpeed = base.wanderer *(1 + Math.pow((level.increaseLevel.wanderer - 1), 2) / 5);
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
                            fading_text("导入成功");

                            setTimeout(() => {
                                button.style.backgroundColor = '';
                            }, 500);
                        } catch (error) {
                            console.error('导入失败:', error.message);

                            button.style.backgroundColor = "rgba(var(--red),.5)";
                            fading_text("导入失败");

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