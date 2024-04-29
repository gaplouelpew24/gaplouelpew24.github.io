entity_system();

//更新数值显示
function display_values(){
    //实体数值
    document.getElementById('Level1EntityHP').textContent = entity.level1.hp.toFixed(0);
    document.getElementById('Level1EntityMaxHP').textContent = entity.level1.maxHp.toFixed(0);

    //上方最基本的数值
    document.getElementById('AlmondWater').textContent = format_number(base.almondWater, true);
    document.getElementById('Wanderers').textContent = format_number(base.wanderer, false);
    document.getElementById('MaxWanderers').textContent = format_number(base.maxWanderer, false);
    document.getElementById('Speed').textContent = format_number((base.speed / 10), true);

    //上方等级
    document.getElementById('PlLevel').textContent = format_number(exp.currentLevel, false);
    document.getElementById('PlExp').textContent = format_number(exp.currentExp, false);
    document.getElementById('PlMaxExp').textContent = format_number(exp.maxExp, false);

    //搜寻杏仁水相关数值
    document.getElementById('AmSearchLv').textContent = format_number(level.searchLevel.almondWater, false);
    document.getElementById('EfficiencySearchAM').textContent = format_number((Math.pow((level.searchLevel.almondWater), 1.7)), true);

    //基地升级
    document.getElementById('BasementLv').textContent = format_number(level.managementLevel.basement, false);
    if(level.managementLevel.basement >= level.managementLevel.maxBasement){
        document.getElementById('BasementLvUpNeed').textContent = "满级 ";
        document.getElementById('BasementWandererUpNeed').textContent = "满级 ";
    }
    else {
        document.getElementById('BasementLvUpNeed').textContent = format_number(moneyneed.upgrade.management.basement.money, true);
        document.getElementById('BasementWandererUpNeed').textContent = format_number(moneyneed.upgrade.management.basement.wanderer, false);
    }

    //探索升级
    document.getElementById('ExplorerLv').textContent = format_number(level.managementLevel.explorer, false);
    if(level.managementLevel.explorer >= level.managementLevel.maxExplorer){
        document.getElementById('ExplorerLvUpNeed').textContent = "满级 ";
        document.getElementById('ExplorerLvUpLvNeed').textContent = "满级 ";
    }
    else {
        document.getElementById('ExplorerLvUpNeed').textContent = format_number(moneyneed.upgrade.management.explorer.money, true);
        document.getElementById('ExplorerLvUpLvNeed').textContent = format_number(moneyneed.upgrade.management.explorer.level, false);
    }

    //流浪者相关数值
    document.getElementById('WandererLv').textContent = format_number(level.increaseLevel.wanderer, false);
    document.getElementById('EfficiencyIncreaseWanderer').textContent = !speed.wandererSpeed > 0 ? "1 毫" :format_number(((speed.wandererSpeed) / base.wanderer), true);

    //购买金额
        if(level.searchLevel.almondWater >= level.searchLevel.maxAlmondWater) document.getElementById('AmSearchLvUpNeed').textContent = "满级 ";
        else document.getElementById('AmSearchLvUpNeed').textContent = format_number(moneyneed.upgrade.search.almondWater, true);

        if(level.increaseLevel.wanderer >= level.increaseLevel.maxWanderer) document.getElementById('WandererLvUpNeed').textContent = "满级 ";
        else document.getElementById('WandererLvUpNeed').textContent = format_number(moneyneed.upgrade.increase.wanderer, true);

        if(base.wanderer >= Math.pow(level.managementLevel.maxBasement, 2) * 40) document.getElementById('BuyWandererNeed').textContent = "满级 ";
        else document.getElementById('BuyWandererNeed').textContent = format_number(moneyneed.buy.wanderer, true);
    //}
}

function format_upgrade_info(currentLevel, maxLevel, moneyNeeded, levelNeeded = null) {
    if (currentLevel >= maxLevel) {
        return "满级 ";
    } else {
        if (levelNeeded !== null) {
            document.getElementById(elementId + 'LvUpLvNeed').textContent = format_number(levelNeeded, false);
        }
        return format_number(moneyNeeded, true);
    }
}

//所需金额
function money_need(){
    //基地
    moneyneed.upgrade.management.basement.money = Math.pow((level.managementLevel.basement + 1) * 2 - 1, 5) * 50;
    moneyneed.upgrade.management.basement.wanderer = Math.pow(level.managementLevel.basement, 2) * 40;

    //探索
    moneyneed.upgrade.management.explorer.money = Math.pow((level.managementLevel.explorer + 2) * 2 - 1, 3) * 500;
    moneyneed.upgrade.management.explorer.level = Math.pow(level.managementLevel.explorer + 1, 2) * 5;

    //可一次性多重购买的内容
    moneyneed.upgrade.search.almondWater = 0;
    moneyneed.upgrade.increase.wanderer = 0;
    moneyneed.buy.wanderer = 0;
    for (let i = 0; i < multiple_buy; i++) {
        moneyneed.upgrade.search.almondWater += Math.pow(level.searchLevel.almondWater + i, 3) / Math.pow(level.searchLevel.almondWater + i, 1.25) * Math.pow(level.searchLevel.almondWater + i, 0.25) * 20 ;
        moneyneed.upgrade.increase.wanderer += Math.pow(level.increaseLevel.wanderer + i, 3.1) * 50;
        moneyneed.buy.wanderer += Math.pow(base.wanderer + 1 + i, 1.2) / Math.pow(base.wanderer + 1 + i, -0.25) * 10;
    }
}

//获取杏仁水与经验的速度
function get_almondwater_exp(){
    if (base.speed>0)
    base.almondWater += base.speed / 1000;
    exp.currentExp += base.speed / 1000 / Math.pow(level.increaseLevel.wanderer, 1.75);
}

//等级与速度
function level_and_speed(){
    speed.wandererSpeed = base.wanderer *(1 + Math.pow((level.increaseLevel.wanderer - 1), 2) / 5);
}