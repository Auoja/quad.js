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


    function QuadTree(settings) {
        var _level = settings.level;
        var _nodeCapacity = settings.capacity;
        var _maxLevel = settings.maxLevel;
        var _nodes = [];
        var _childQuads = [];
        var _bounds = new Bounds(settings.x, settings.y, settings.w, settings.h);

        function _hasChildren() {
            return _childQuads.length > 0;
        }

        function _split() {
            var x = _bounds.getLeft();
            var y = _bounds.getTop();
            var width = _bounds.getHalfWidth();
            var height = _bounds.getHalfHeight();

            _childQuads[TOP_LEFT_QUADRANT] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x,
                y: y,
                w: width,
                h: height
            });
            _childQuads[TOP_RIGHT_QUADRANT] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x + width,
                y: y,
                w: width,
                h: height
            });
            _childQuads[BOTTOM_LEFT_QUADRANT] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x,
                y: y + height,
                w: width,
                h: height
            });
            _childQuads[BOTTOM_RIGHT_QUADRANT] = new QuadTree({
                level: _level + 1,
                capacity: _nodeCapacity,
                maxLevel: _maxLevel,
                x: x + width,
                y: y + height,
                w: width,
                h: height
            });
        }

        function _getIndex(node) {
            var index = NO_QUADRANT;

            var nodeBounds = new Bounds(node.x, node.y, node.w, node.h);

            if (_bounds.getTopLeft().insideBounds(nodeBounds)) {
                index = TOP_LEFT_QUADRANT;
            } else if (_bounds.getTopRight().insideBounds(nodeBounds)) {
                index = TOP_RIGHT_QUADRANT;
            } else if (_bounds.getBottomLeft().insideBounds(nodeBounds)) {
                index = BOTTOM_LEFT_QUADRANT;
            } else if (_bounds.getBottomRight().insideBounds(nodeBounds)) {
                index = BOTTOM_RIGHT_QUADRANT;
            }

            return index;
        }

        this._insert = function(node) {
            var index;

            if (_hasChildren()) {
                index = _getIndex(node);
                if (index !== NO_QUADRANT) {
                    _childQuads[index]._insert(node);
                }
                return;
            }

            _nodes.push(node);

            if (_nodes.length > _nodeCapacity && _level < _maxLevel) {
                if (!_hasChildren()) {
                    _split();
                }
                _nodes.forEach(function(node) {
                    index = _getIndex(node);
                    if (index !== NO_QUADRANT) {
                        _childQuads[index]._insert(node);
                    }
                });
                _nodes = [];
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
            _nodes = [];
            _childQuads.forEach(function(childQuad) {
                childQuad.clear();
            });
            _childQuads = [];
        };

        this.retrieve = function(node) {
            var result = _nodes;

            if (_hasChildren()) {
                var index = _getIndex(node);

                if (index !== NO_QUADRANT) {
                    result = result.concat(_childQuads[index].retrieve(node));
                } else {
                    // TODO: This needs to be improved for large search areas
                    _childQuads.forEach(function(childQuad) {
                        result = result.concat(childQuad.retrieve(node));
                    });
                }
            }
            return result;
        };

        this.toArray = function() {
            var result = [{
                nodes: _nodes,
                bounds: {
                    x: _bounds.getLeft(),
                    y: _bounds.getTop(),
                    width: _bounds.getWidth(),
                    height: _bounds.getHeight()
                },
                level: _level
            }];
            _childQuads.forEach(function(childQuad) {
                result = result.concat(childQuad.toArray());
            });
            return result;
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