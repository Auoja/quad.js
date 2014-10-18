(function(exports) {

    function Quad() {

    }

    exports.create = function() {
        return new Quad();
    };


})(typeof exports === 'undefined' ? this['Quad'] = {} : exports);