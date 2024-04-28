//随机数
function get_random_int(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}

//打怪系统
function entity_system(){
    const Lv1Entities = ["猎犬", "死亡飞蛾", "钝人", "悲尸"];
    let randomLv1Entity = Lv1Entities[Math.floor(Math.random() * Lv1Entities.length)];
    document.getElementById('RandomLevel1Entity').textContent = randomLv1Entity;

    entity.level1.maxHp = (get_random_int(Math.pow(exp.currentLevel, 2.2), Math.pow(exp.currentLevel, 2.27)) / exp.currentLevel * 1.2);
    entity.level1.hp = entity.level1.maxHp;
    entity.level1.exp = get_random_int(Math.pow(exp.currentLevel, 2.5), Math.pow(exp.currentLevel, 2.7));
}

entity_system();