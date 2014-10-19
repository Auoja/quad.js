(function(exports) {

    var QT_NODE_CAPACITY = 1;
    var QT_MAX_LEVELS = 10;

    function Bounds(x, y, w, h) {
        this._l = x;
        this._t = y;
        this._r = x + w;
        this._b = y + h;

        this._width = w;
        this._height = h;
        this._halfWidth = Math.round(this._width / 2);
        this._halfHeight = Math.round(this._height / 2);
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


    function QuadTree(opts) {

        var _level = opts.level || 0;
        var _objects = [];
        var _nodes = [];
        var _bounds = new Bounds(opts.x, opts.y, opts.w, opts.h);

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

        this.insert = function(node) {
            var index;
            var i = 0;

            if (_nodes[0] !== undefined) {
                index = _getIndex(node);
                if (index !== -1) {
                    _nodes[index].insert(node);
                }
                return;
            }

            _objects.push(node);

            if (_objects.length > QT_NODE_CAPACITY && _level < QT_MAX_LEVELS) {
                if (_nodes[0] === undefined) {
                    this.split();
                }
                while (i < _objects.length) {
                    index = _getIndex(_objects[i]);
                    if (index !== -1) {
                        _nodes[index].insert(_objects.splice(i, 1)[0]);
                    } else {
                        i++;
                    }
                }

            }

        };

        this.clear = function() {
            _objects = [];
            for (var i = _nodes.length - 1; i >= 0; i--) {
                if (_nodes[i]) {
                    _nodes[i].clear();
                }
            }
            _nodes = [];
        };

        this.split = function() {

            var x = _bounds.getLeft();
            var y = _bounds.getTop();
            var width = _bounds.getHalfWidth();
            var height = _bounds.getHalfHeight();

            _nodes[0] = new QuadTree({
                level: _level + 1,
                x: x,
                y: y,
                w: width,
                h: height
            });
            _nodes[1] = new QuadTree({
                level: _level + 1,
                x: x + width,
                y: y,
                w: width,
                h: height
            });
            _nodes[2] = new QuadTree({
                level: _level + 1,
                x: x,
                y: y + height,
                w: width,
                h: height
            });
            _nodes[3] = new QuadTree({
                level: _level + 1,
                x: x + width,
                y: y + height,
                w: width,
                h: height
            });

        };

        this.retrieve = function(node) {
            var index = _getIndex(node);
            var result = _objects;
            if (_nodes[0] !== undefined) {
                if (index !== -1) {
                    result = result.concat(_nodes[0].retrieve(node));
                } else {
                    for (var i = _nodes.length - 1; i >= 0; i--) {
                        result = result.concat(_nodes[i].retrieve(node));
                    }
                }
            }
            return result;
        };

    }

    exports.create = function(opts) {
        return new QuadTree(opts);
    };


})(typeof exports === 'undefined' ? this['Quad'] = {} : exports);