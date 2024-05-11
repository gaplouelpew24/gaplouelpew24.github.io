fetch('html/notice.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('Notice').innerHTML = html;
});

fetch('html/leftbar.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('LeftBar').innerHTML = html;
});

fetch('html/topbar.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('TopBar').innerHTML = html;
});

fetch('html/rightclickmenu.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('RightClickMenu').innerHTML = html;
});

fetch('html/maincontent/base.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CBase').innerHTML = html;
});

fetch('html/maincontent/search.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CSearch').innerHTML = html;
});

fetch('html/maincontent/explorer.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CExplorer').innerHTML = html;
});

fetch('html/maincontent/inventory.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CInventory').innerHTML = html;
});

fetch('html/maincontent/research.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CResearch').innerHTML = html;
});

fetch('html/maincontent/bag.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CBag').innerHTML = html;
});

fetch('html/maincontent/craft.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('CCraft').innerHTML = html;
});


//在fetch完成之后再执行其他js文件
function loadScripts() {
    var script1 = document.createElement('script');
    script1.src = 'script/variables.js';
    document.body.appendChild(script1);

    var script2 = document.createElement('script');
    script2.src = 'script/attackEntity.js';
    document.body.appendChild(script2);

    var script3 = document.createElement('script');
    script3.src = 'script/basicContent.js';
    document.body.appendChild(script3);

    var script4 = document.createElement('script');
    script4.src = 'script/gamePlay.js';
    document.body.appendChild(script4);

    var script5 = document.createElement('script');
    script5.src = 'script/click.js';
    document.body.appendChild(script5);

    var script6 = document.createElement('script');
    script6.src = 'script/update.js';
    document.body.appendChild(script6);

    var script7 = document.createElement('script');
    script7.src = 'script/draggable.js';
    document.body.appendChild(script7);

    document.getElementById('Loading').classList.add('hide');
}