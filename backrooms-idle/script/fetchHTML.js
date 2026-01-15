function fetch_and_inject(htmlPath, targetElementId) {
    fetch(htmlPath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(targetElementId).innerHTML = html;
        });
}

const htmlFiles = [
    { path: 'html/notice.html', targetId: 'Notice' },
    { path: 'html/leftbar.html', targetId: 'LeftBar' },
    { path: 'html/topbar.html', targetId: 'TopBar' },
    { path: 'html/rightclickmenu.html', targetId: 'RightClickMenu' },
    { path: 'html/maincontent/base.html', targetId: 'CBase' },
    { path: 'html/maincontent/search.html', targetId: 'CSearch' },
    { path: 'html/maincontent/explorer.html', targetId: 'CExplorer' },
    { path: 'html/maincontent/inventory.html', targetId: 'CInventory' },
    { path: 'html/maincontent/research.html', targetId: 'CResearch' },
    { path: 'html/maincontent/bag.html', targetId: 'CBag' },
    { path: 'html/maincontent/craft.html', targetId: 'CCraft' }
];

htmlFiles.forEach(file => {
    fetch_and_inject(file.path, file.targetId);
});


//在fetch完成之后再执行其他js文件
function load_script(src) {
    return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function load_scripts_in_order() {
    load_script('script/variables.js')
        .then(function() {
            return load_script('script/attackEntity.js');
        })
        .then(function() {
            return load_script('script/basicContent.js');
        })
        .then(function() {
            return load_script('script/gamePlay.js');
        })
        .then(function() {
            return load_script('script/click.js');
        })
        .then(function() {
            return load_script('script/update.js');
        })
        .then(function() {
            return load_script('script/draggable.js');
        })
        .then(function() {
            document.getElementById('Loading').classList.add('hide');
        })
        .catch(function(error) {
            console.error('Error loading script: ', error);
        });
}