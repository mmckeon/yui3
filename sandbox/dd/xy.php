<?php
$count = (($_GET['count']) ? $_GET['count'] : 100);
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <title>YUI: XY</title>
    <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.6.0/build/reset-fonts-grids/reset-fonts-grids.css"> 
    <link rel="stylesheet" href="http://blog.davglass.com/files/yui/css/davglass.css" type="text/css">
    <style type="text/css" media="screen">
        p, h2 {
            margin: 1em;
        }
        #node {
            position: relative;
            top: 200px;
            left: 200px;
            border: 1px solid black;
            background-color: #ccc;
            height: 20px;
            width: 20px;
        }
	</style>
</head>
<body class="yui-skin-sam">
<div id="davdoc" class="yui-t7">
    <div id="hd"><h1 id="header"><a href="http://blog.davglass.com/">YUI: DragDrop 3.x</a></h1></div>
    <div id="bd">
        <div id="node"></div>
        <div id="res"></div>
    </div>
    <div id="ft">&nbsp;</div>
</div>

<script type="text/javascript" src="../../build/yui/yui-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/attribute/attribute-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/base/base-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/event/event-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/oop/oop-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/dom/dom-debug.js?bust=<?php echo(mktime()); ?>"></script>
<script type="text/javascript" src="../../build/node/node-debug.js?bust=<?php echo(mktime()); ?>"></script>




<script type="text/javascript">
var yConfig = {
    base: '../../build/',
    allowRollup: false,
    logExclude: {
        'YUI': true,
        Event: true,
        Base: true,
        Attribute: true,
        augment: true
    },
    throwFail: true,
    debug: false
};

//var Y1 = new YUI().use('dd-drag', 'dd-proxy');
YUI(yConfig).use('dd-ddm', 'dd-drag', 'dd-scroll', function(Y) {
    myY = Y;
    
    var node = Y.get('#node'),
        res = [];
    
    for (var i = 1; i <= <?php echo($count); ?>; i++) {
        var s = (new Date()).getTime();
        node.getXY();
        res.push((new Date()).getTime() - s);
    }
    Y.get('#res').set('innerHTML', res.join('<br>'));
});


</script>
</body>
</html>
<?php @include_once($_SERVER["DOCUMENT_ROOT"]."/wp-content/plugins/shortstat/inc.stats.php"); ?>
