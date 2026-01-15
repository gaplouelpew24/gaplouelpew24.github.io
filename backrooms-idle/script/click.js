//点击事件
function click_event(name, button, secname){
    switch (name){
    //搜寻
    case "search":
        //杏仁水
        if (secname == "AM") {
        base.almondWater += Math.pow((level.searchLevel.almondWater), 1.7);
        exp.currentExp += Math.pow(level.searchLevel.almondWater, 0.5);
        fading_text("获得 " + format_number(Math.pow((level.searchLevel.almondWater), 1.7), true) + "升杏仁水", "orange");
        }
        return;
        
    //购买
    case "buy":
        if (secname == "Wanderer" && base.wanderer + multiple_buy <= base.maxWanderer && base.almondWater >= moneyneed.buy.wanderer ) {
            base.almondWater -= moneyneed.buy.wanderer;
            base.wanderer += multiple_buy;
            return;
        }

        button.style.backgroundColor = "rgba(var(--red),.5)";
        setTimeout(() => {
            button.style.backgroundColor = '';
            }, 100);

    //等级升级
    case "upgrade":
        //杏仁水搜寻升级
        if (secname == "SearchAM" && level.searchLevel.almondWater + multiple_buy <= level.searchLevel.maxAlmondWater && base.almondWater >= moneyneed.upgrade.search.almondWater) {
            base.almondWater -= moneyneed.upgrade.search.almondWater;
            level.searchLevel.almondWater += multiple_buy;
            return;
        }
        //流浪者升级
        if (secname == "Wanderer" && level.increaseLevel.wanderer + multiple_buy <= level.increaseLevel.maxWanderer && base.almondWater >= moneyneed.upgrade.increase.wanderer) {
            base.almondWater -= moneyneed.upgrade.increase.wanderer;
            level.increaseLevel.wanderer += multiple_buy;
            return;
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

        button.style.backgroundColor = "rgba(var(--red),.5)";
        setTimeout(() => {
            button.style.backgroundColor = '';
            }, 100);

    //打实体
    case "attack":
        if (secname == "level1") {
            let randomhurt = get_random_int(1, 3)
            entity.level1.hp -= randomhurt;
            if (entity.level1.hp - randomhurt <= 0){
                exp.currentExp += entity.level1.exp;
                fading_text("获得" + entity.level1.exp.toFixed(0) + "经验", "green");
                entity_system();
            }
            else {
                fading_text("造成 " + randomhurt + " 点伤害", "orange");
            }
            return;
        }
    }
};