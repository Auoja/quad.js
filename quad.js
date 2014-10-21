(function(exports) {

    var NO_QUADRANT = -1;
    var TOP_LEFT_QUADRANT = 0;
    var TOP_RIGHT_QUADRANT = 1;
    var BOTTOM_LEFT_QUADRANT = 2;
    var BOTTOM_RIGHT_QUADRANT = 3;

    var defaultSettings = {
        x: 0,
        y: 0,
        w: 512,
        h: 512,
        maxLevel: 8,
        capacity: 5,
        level: 0
    };

    var defaultNode = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    };

    function extend(defaults, options) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    }

    // Bounds
    function Bounds(x, y, w, h) {
        this._l = x;
        this._t = y;
        this._r = x + w;
        this._b = y + h;

        this._width = w;
        this._height = h;
        this._halfWidth = Math.floor(this._width / 2);
        this._halfHeight = Math.floor(this._height / 2);
    }

    Bounds.prototype.insideBounds = function(rect) {
        if (this.getTop() <= rect.getTop() &&
            this.getLeft() <= rect.getLeft() &&
            this.getRight() >= rect.getRight() &&
            this.getBottom() >= rect.getBottom()) {
            return true;
        }

        return false;
    };

    Bounds.prototype.getTopLeft = function() {
        return new Bounds(this._l, this._t, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getTopRight = function() {
        return new Bounds(this._l + this._halfWidth, this._t, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getBottomLeft = function() {
        return new Bounds(this._l, this._t + this._halfHeight, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getBottomRight = function() {
        return new Bounds(this._l + this._halfWidth, this._t + this._halfHeight, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getLeft = function() {
        return this._l;
    };

    Bounds.prototype.getTop = function() {
        return this._t;
    };

    Bounds.prototype.getRight = function() {
        return this._r;
    };

    Bounds.prototype.getBottom = function() {
        return this._b;
    };

    Bounds.prototype.getWidth = function() {
        return this._width;
    };

    Bounds.prototype.getHeight = function() {
        return this._height;
    };

    Bounds.prototype.getHalfWidth = function() {
        return this._halfWidth;
    };

    Bounds.prototype.getHalfHeight = function() {
        return this._halfHeight;
    };


    // Quad
    function Quad(settings) {
        this.level = settings.level;
        this.nodes = [];
        this.childQuads = [];
        this.bounds = new Bounds(settings.x, settings.y, settings.w, settings.h);
    }

    Quad.prototype.hasChildren = function() {
        return this.childQuads.length > 0;
    };

    Quad.prototype.getIndex = function(node) {
        var index = NO_QUADRANT;

        var nodeBounds = new Bounds(node.x, node.y, node.w, node.h);

        if (this.bounds.getTopLeft().insideBounds(nodeBounds)) {
            index = TOP_LEFT_QUADRANT;
        } else if (this.bounds.getTopRight().insideBounds(nodeBounds)) {
            index = TOP_RIGHT_QUADRANT;
        } else if (this.bounds.getBottomLeft().insideBounds(nodeBounds)) {
            index = BOTTOM_LEFT_QUADRANT;
        } else if (this.bounds.getBottomRight().insideBounds(nodeBounds)) {
            index = BOTTOM_RIGHT_QUADRANT;
        }

        return index;
    };

    Quad.prototype.split = function() {
        var x = this.bounds.getLeft();
        var y = this.bounds.getTop();
        var width = this.bounds.getHalfWidth();
        var height = this.bounds.getHalfHeight();

        this.childQuads[TOP_LEFT_QUADRANT] = new Quad({
            level: this.level + 1,
            x: x,
            y: y,
            w: width,
            h: height
        });
        this.childQuads[TOP_RIGHT_QUADRANT] = new Quad({
            level: this.level + 1,
            x: x + width,
            y: y,
            w: width,
            h: height
        });
        this.childQuads[BOTTOM_LEFT_QUADRANT] = new Quad({
            level: this.level + 1,
            x: x,
            y: y + height,
            w: width,
            h: height
        });
        this.childQuads[BOTTOM_RIGHT_QUADRANT] = new Quad({
            level: this.level + 1,
            x: x + width,
            y: y + height,
            w: width,
            h: height
        });
    };

    function QuadTree(settings) {
        var _root = new Quad(settings);
        var _nodeCapacity = settings.capacity; // ?
        var _maxLevel = settings.maxLevel;

        // Private

        function _insert(node, treeRoot) {
            var index;

            if (treeRoot.hasChildren()) {
                index = treeRoot.getIndex(node);
                if (index !== NO_QUADRANT) {
                    _insert(node, treeRoot.childQuads[index]);
                }
                return;
            }

            treeRoot.nodes.push(node);

            if (treeRoot.nodes.length > _nodeCapacity && treeRoot.level < _maxLevel) {
                if (!treeRoot.hasChildren()) {
                    treeRoot.split();
                }
                treeRoot.nodes.forEach(function(node) {
                    index = treeRoot.getIndex(node);
                    if (index !== NO_QUADRANT) {
                        _insert(node, treeRoot.childQuads[index]);
                    }
                });
                treeRoot.nodes = [];
            }
        }

        function _retrieve(node, treeRoot) {
            var result = treeRoot.nodes;

            if (treeRoot.hasChildren()) {
                var index = treeRoot.getIndex(node);

                if (index !== NO_QUADRANT) {
                    result = result.concat(_retrieve(node, treeRoot.childQuads[index]));
                } else {
                    // TODO: This needs to be improved for large search areas
                    treeRoot.childQuads.forEach(function(childQuad) {
                        result = result.concat(_retrieve(node, childQuad));
                    });
                }
            }
            return result;
        }

        function _toArray(treeRoot) {
            var result = [{
                nodes: treeRoot.nodes,
                bounds: {
                    x: treeRoot.bounds.getLeft(),
                    y: treeRoot.bounds.getTop(),
                    width: treeRoot.bounds.getWidth(),
                    height: treeRoot.bounds.getHeight()
                },
                level: treeRoot.level
            }];

            treeRoot.childQuads.forEach(function(childQuad) {
                result = result.concat(_toArray(childQuad));
            });

            return result;
        }

        // Public

        this.getTree = function() {
            return _root;
        };

        this.retrieve = function(node) {
            node = extend(defaultNode, node);
            if (_root.bounds.insideBounds(new Bounds(node.x, node.y, node.w, node.h))) {
                return _retrieve(node, _root);
            }
        };

        this.insert = function(node) {
            node = extend(defaultNode, node);
            if (_root.bounds.insideBounds(new Bounds(node.x, node.y, node.w, node.h))) {
                _insert(node, _root);
            }
        };

        this.toArray = function() {
            return _toArray(_root);
        };

    }

    exports.create = function(settings) {
        settings = extend(defaultSettings, settings);
        if (settings.w / Math.pow(2, settings.maxLevel) < 1 || settings.h / Math.pow(2, settings.maxLevel) < 1) {
            settings = defaultSettings;
        }
        return new QuadTree(settings);
    };


})(typeof exports === 'undefined' ? this['Quad'] = {} : exports);