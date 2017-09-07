

function draw(image) {
    //isDown 是否按下鼠标
    var isDown = false;
    //是否移动鼠标
    var isMove = false;


    //按下鼠标时的第一个点
    var firstPoint = {
        x: 0,
        y: 0
    }
    //移动时的点
    var movePoint = {
        x: 0,
        y: 0
    }
    //设置舞台stage
    var stage = new Konva.Stage({
        container: "container",
        width: image.width,
        height: image.height,
    });
    //layer1  image层
    var layer1 = new Konva.Layer();
    // //layer2  选框层
    // var layer2 = new Konva.Layer();

    var newImg = new Konva.Image({
        x: 0,
        y: 0,
        image: image,
        width: image.width,
        height: image.height
    });
    layer1.add(newImg);
    stage.add(layer1);

    //layer2  选框层 (虚拟层)
    var layer2 = new Konva.Layer();
    var rect;

    //显示层
    var layer3 = new Konva.Layer();
    var config;
    var lastRect;

    //生成的矩形框的起始点
    var startPoint = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    stage.on("mousedown", function (evt) {
        isDown = true;
        firstPoint.x = evt.evt.layerX;
        firstPoint.y = evt.evt.layerY;
        // var img = stage.toImage({
        //     x:20,
        //     y:20,
        //     width:100,
        //     height:100,
        //     callback:getImg,
        //     mimeType:"image/png",
            
        // })
    })
    stage.on("mousemove", function (evt) {
        if (isDown) {
            isMove = true;
            movePoint.x = evt.evt.layerX;
            movePoint.y = evt.evt.layerY;

            if (movePoint.x > firstPoint.x && movePoint.y > firstPoint.y) {
                //往右下移动
                startPoint.x = firstPoint.x;
                startPoint.y = firstPoint.y;
                startPoint.width = movePoint.x - firstPoint.x;
                startPoint.height = movePoint.y - firstPoint.y;
            } else if (movePoint.x > firstPoint.x && movePoint.y < firstPoint.y) {
                //往右上移动
                startPoint.x = firstPoint.x;
                startPoint.y = movePoint.y;
                startPoint.width = movePoint.x - firstPoint.x;
                startPoint.height = firstPoint.y - movePoint.y;
            } else if (movePoint.x < firstPoint.x && movePoint.y > firstPoint.y) {
                //往左下移动
                startPoint.x = movePoint.x;
                startPoint.y = firstPoint.y;
                startPoint.width = firstPoint.x - movePoint.x;
                startPoint.height = movePoint.y - firstPoint.y;
            } else if (movePoint.x < firstPoint.x && movePoint.y < firstPoint.y) {
                //往左上移动
                startPoint.x = movePoint.x;
                startPoint.y = movePoint.y;
                startPoint.width = firstPoint.x - movePoint.x;
                startPoint.height = firstPoint.y - movePoint.y;
            }
            config = {
                x: startPoint.x,
                y: startPoint.y,
                width: startPoint.width,
                height: startPoint.height,
                opacity: 0.5,
                fill: "#FFB3B3"
            };
            rect = new Konva.Rect(config);
            layer2.removeChildren();
            layer2.add(rect);
            stage.add(layer2);
        }
    })
    stage.on("mouseup", function (evt) {

        isDown = false;
        if (isMove) {
            layer2.clear();
            lastRect = new Konva.Rect(config);
            config = null;
            lastRect.hasBorder = false;
            layer3.add(lastRect);
            stage.add(layer3);
            //给新添加的rect绑定mousedown事件
            lastRect.on("mousedown", function () {
                //重置是否存在选中rect为false
                hasClickedRect = false;
                if (this.hasBorder) {
                    this.setStroke(null);
                    this.hasBorder = false;
                } else {
                    this.setStroke("black");
                    this.hasBorder = true;
                }
                layer3.add(lastRect);
                stage.add(layer3);
                //遍历layer3，如果存在hasBorder
                for (var i = 0; i < layer3.children.length; i++) {
                    if (layer3.children[i].hasBorder) {
                        hasClickedRect = true;
                        $("#addTextarea").prop("disabled",false);
                    }
                }

            })
            lastRect.fire("click");
            isMove = false;
        }
    })

}

window.onload = function () {
    //是否有rect被选中
    var hasClickedRect = false;

    
    var img = new Image();
    img.src = "19862414_980x1200_0.jpg";
    img.onload = function () {
        draw(img);
    }

    $("#addTextarea").click(function () {
        $(this).after("<textarea><textarea>");
    }).prop("disabled",true);

}

// //生成图片回调
// function getImg(img){
//     console.log(img);
// }