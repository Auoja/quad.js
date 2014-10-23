function startDemo() {

    var canvas = document.getElementById("canvas");
    canvas.addEventListener("mousedown", mousedown, false);

    var drag = false;
    var select = false;
    var startX;
    var startY;
    var endX;
    var endY;

    var qArray;

    var rect = canvas.getBoundingClientRect();

    var ctx = canvas.getContext('2d');
    // Fix for anti-aliasing
    ctx.translate(0.5, 0.5);
    ctx.lineWidth = 0.5;

    var q = new Quad({
        w: canvas.width,
        h: canvas.height,
        capacity: 1
    });

    function mousedown(event) {
        canvas.addEventListener("mouseup", mouseup, false);
        canvas.addEventListener("mousemove", mousemove, false);
        startX = event.x - rect.left;
        startY = event.y - rect.top;
        select = false;
    }

    function mousemove(event) {
        endX = event.x - rect.left;
        endY = event.y - rect.top;
        drag = true;
        render();
    }

    function mouseup(event) {
        endX = event.x - rect.left;
        endY = event.y - rect.top;

        if (drag) {
            drag = false;
            select = true;
        } else {
            q.insert({
                x: endX,
                y: endY
            });
        }

        render();
        canvas.removeEventListener("mouseup", mouseup, false);
        canvas.removeEventListener("mousemove", mousemove, false);
    }

    function drawNodes() {
        qArray.forEach(function(item) {
            ctx.beginPath();
            ctx.fillStyle = "red";
            item.nodes.forEach(function(node) {
                ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
            });
            ctx.closePath();
            ctx.stroke();
        });
    }

    function drawBounds() {
        qArray.forEach(function(item) {
            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.rect(item.bounds.x, item.bounds.y, item.bounds.width, item.bounds.height);
            ctx.closePath();
            ctx.stroke();
        });
    }

    function drawDragBox() {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.rect(startX, startY, (endX - startX), (endY - startY));
        ctx.closePath();
        ctx.stroke();
    }

    function drawSelected() {
        q.retrieve({
            x: startX < endX ? startX : endX,
            y: startY < endY ? startY : endY,
            w: (endX - startX) < 0 ? (startX - endX) : (endX - startX),
            h: (endY - startY) < 0 ? (startY - endY) : (endY - startY)
        }).forEach(function(item) {
            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.arc(item.x, item.y, 5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();
        });
    }

    function render() {
        qArray = q.toArray();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawNodes();
        drawBounds();
        if (drag) {
            drawDragBox();
        }
        if (select) {
            drawSelected();
        }
    }

    for (var i = 0; i < 100; i++) {
        q.insert({
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height),
            w: 0,
            h: 0
        });
    }

    render();
}