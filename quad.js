(function(exports) {

    var defaultSettings = {
        x: 0,
        y: 0,
        w: 512,
        h: 512,
        maxLevel: 10,
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

    Bounds.prototype.getCenter = function() {
        return {
            centerX: this._l + this._halfWidth,
            centerY: this._t + this._halfHeight
        };
    };

    Bounds.prototype.insideBounds = function(rect) {
        if (this.getTop() <= rect.getTop() &&
            this.getLeft() <= rect.getLeft() &&
            this.getRight() >= rect.getRight() &&
            this.getBottom() >= rect.getBottom()) {
            return true;
        }

        return false;
    };

    Bounds.prototype.canBeSplit = function () {
        if (this._halfWidth < 1 || this._halfHeight < 1) {
            throw Error("Quads are to small. Try lowering quadtree max level.")
        }
    };

    Bounds.prototype.getTopLeft = function() {
        this.canBeSplit();
        return new Bounds(this._l, this._t, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getTopRight = function() {
        this.canBeSplit();
        return new Bounds(this._l + this._halfWidth, this._t, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getBottomLeft = function() {
        this.canBeSplit();
        return new Bounds(this._l, this._t + this._halfHeight, this._halfWidth, this._halfHeight);
    };

    Bounds.prototype.getBottomRight = function() {
        this.canBeSplit();
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


    function QuadTree(settings) {

        var _level = settings.level;
        var _nodeCapacity = settings.capacity;
        var _maxLevel = settings.maxLevel;
        var _objects = [];
        var _nodes = [];
        var _bounds = new Bounds(settings.x, settings.y, settings.w, settings.h);
        var _hasChildren = false;


        function _split() {

            var x = _bounds.getLeft();
            var y = _bounds.getTop();
            var width = _bounds.getHalfWidth();
            var height = _bounds.getHalfHeight();

            _nodes[0] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x,
                y: y,
                w: width,
                h: height
            });
            _nodes[1] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x + width,
                y: y,
                w: width,
                h: height
            });
            _nodes[2] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x,
                y: y + height,
                w: width,
                h: height
            });
            _nodes[3] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x + width,
                y: y + height,
                w: width,
                h: height
            });

            _hasChildren = true;
        }

        function _getIndex(node) {
            var index = -1;

            var nodeBounds = new Bounds(node.x, node.y, node.w, node.h);

            if (_bounds.getTopLeft().insideBounds(nodeBounds)) {
                index = 0;
            } else if (_bounds.getTopRight().insideBounds(nodeBounds)) {
                index = 1;
            } else if (_bounds.getBottomLeft().insideBounds(nodeBounds)) {
                index = 2;
            } else if (_bounds.getBottomRight().insideBounds(nodeBounds)) {
                index = 3;
            }

            return index;
        }

        this._insert = function(node) {
            var index;
            var i = 0;

            if (_hasChildren) {
                index = _getIndex(node);
                if (index !== -1) {
                    _nodes[index]._insert(node);
                }
                return;
            }

            _objects.push(node);

            if (_objects.length > _nodeCapacity && _level < _maxLevel) {
                if (!_hasChildren) {
                    _split();
                }
                _objects.forEach(function(_object) {
                    index = _getIndex(_object);
                    if (index !== -1) {
                        _nodes[index]._insert(_object);
                    }
                });
                _objects = [];
            }
        };

        this.insert = function(node) {
            node = extend(defaultNode, node);
            if (_bounds.insideBounds(new Bounds(node.x, node.y, node.w, node.h))) {
                this._insert(node);
            }
        };

        this.getBounds = function() {
            return _bounds;
        };

        this.remove = function(node) {
            // TODO: Add removal
        };

        this.clear = function() {
            _objects = [];
            _nodes.forEach(function(_node) {
                _node.clear();
            });
            _nodes = [];
        };

        this.retrieve = function(node) {
            var result = _objects;

            if (_hasChildren) {
                var index = _getIndex(node);

                if (index !== -1) {
                    result = result.concat(_nodes[index].retrieve(node));
                } else {
                    // TODO: This needs to be improved for large search areas
                    _nodes.forEach(function(_node) {
                        result = result.concat(_node.retrieve(node));
                    });
                }
            }
            return result;
        };

        this.toArray = function() {
            var result = [{
                nodes: _objects,
                bBox: _bounds,
                level: _level
            }];
            _nodes.forEach(function(_node) {
                result = result.concat(_node.toArray());
            });
            return result;
        };

    }

    exports.create = function(settings) {
        return new QuadTree(extend(defaultSettings, settings));
    };


})(typeof exports === 'undefined' ? this['Quad'] = {} : exports);