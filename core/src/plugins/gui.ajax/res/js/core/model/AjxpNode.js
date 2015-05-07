'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var AjxpNode = (function (_Observable) {

    /**
     *
     * @param path String
     * @param isLeaf Boolean
     * @param label String
     * @param icon String
     * @param iNodeProvider IAjxpNodeProvider
     */

    function AjxpNode(path) {
        var isLeaf = arguments[1] === undefined ? false : arguments[1];
        var label = arguments[2] === undefined ? '' : arguments[2];
        var icon = arguments[3] === undefined ? '' : arguments[3];
        var iNodeProvider = arguments[4] === undefined ? null : arguments[4];

        _classCallCheck(this, AjxpNode);

        _Observable.call(this);
        this._path = path;
        if (this._path && this._path.length && this._path.length > 1) {
            if (this._path[this._path.length - 1] == '/') {
                this._path = this._path.substring(0, this._path.length - 1);
            }
        }
        this._isLeaf = isLeaf;
        this._label = label;
        this._icon = icon;
        this._isRoot = false;

        this._metadata = new Map();
        this._children = new Map();

        this._isLoaded = false;
        this.fake = false;
        this._iNodeProvider = iNodeProvider;
    }

    _inherits(AjxpNode, _Observable);

    /**
     * The node is loaded or not
     * @returns Boolean
     */

    AjxpNode.prototype.isLoaded = function isLoaded() {
        return this._isLoaded;
    };

    /**
     * Changes loaded status
     * @param bool Boolean
     */

    AjxpNode.prototype.setLoaded = function setLoaded(bool) {
        this._isLoaded = bool;
    };

    /**
     * Loads the node using its own provider or the one passed
     * @param iAjxpNodeProvider IAjxpNodeProvider Optionnal
     */

    AjxpNode.prototype.load = function load(iAjxpNodeProvider) {
        if (this._isLoading) {
            return;
        }if (!iAjxpNodeProvider) {
            if (this._iNodeProvider) {
                iAjxpNodeProvider = this._iNodeProvider;
            } else {
                iAjxpNodeProvider = new RemoteNodeProvider();
            }
        }
        this._isLoading = true;
        this.notify('loading');
        if (this._isLoaded) {
            this._isLoading = false;
            this.notify('loaded');
            return;
        }
        iAjxpNodeProvider.loadNode(this, (function (node) {
            this._isLoaded = true;
            this._isLoading = false;
            this.notify('loaded');
            this.notify('first_load');
        }).bind(this));
    };

    /**
     * Remove children and reload node
     * @param iAjxpNodeProvider IAjxpNodeProvider Optionnal
     */

    AjxpNode.prototype.reload = function reload(iAjxpNodeProvider) {
        this._children.forEach(function (child, key) {
            child.notify('node_removed');
            child._parentNode = null;
            this._children['delete'](key);
            this.notify('child_removed', child);
        }, this);
        this._isLoaded = false;
        this.load(iAjxpNodeProvider);
    };

    /**
     * Unload child and notify "force_clear"
     */

    AjxpNode.prototype.clear = function clear() {
        this._children.forEach(function (child, key) {
            child.notify('node_removed');
            child._parentNode = null;
            this._children['delete'](key);
            this.notify('child_removed', child);
        }, this);
        this._isLoaded = false;
        this.notify('force_clear');
    };

    /**
     * Sets this AjxpNode as being the root parent
     */

    AjxpNode.prototype.setRoot = function setRoot() {
        this._isRoot = true;
    };

    /**
     * Set the node children as a bunch
     * @param ajxpNodes AjxpNodes[]
     */

    AjxpNode.prototype.setChildren = function setChildren(ajxpNodes) {
        this._children = new Map();
        ajxpNodes.forEach((function (value) {
            this._children.set(value.getPath(), value);
            value.setParent(this);
        }).bind(this));
    };

    /**
     * Get all children as a bunch
     * @returns AjxpNode[]
     */

    AjxpNode.prototype.getChildren = function getChildren() {
        return this._children;
    };

    AjxpNode.prototype.getFirstChildIfExists = function getFirstChildIfExists() {
        if (this._children.size) {
            return this._children.values().next().value;
        }
        return null;
    };

    /**
     * Adds a child to children
     * @param ajxpNode AjxpNode The child
     */

    AjxpNode.prototype.addChild = function addChild(ajxpNode) {
        ajxpNode.setParent(this);
        if (this._iNodeProvider) ajxpNode._iNodeProvider = this._iNodeProvider;
        var existingNode = this.findChildByPath(ajxpNode.getPath());
        if (existingNode && !(existingNode instanceof String)) {
            existingNode.replaceBy(ajxpNode, 'override');
        } else {
            this._children.set(ajxpNode.getPath(), ajxpNode);
            this.notify('child_added', ajxpNode.getPath());
        }
    };

    /**
     * Removes the child from the children
     * @param ajxpNode AjxpNode
     */

    AjxpNode.prototype.removeChild = function removeChild(ajxpNode) {
        var removePath = ajxpNode.getPath();
        ajxpNode.notify('node_removed');
        ajxpNode._parentNode = null;
        this._children['delete'](ajxpNode.getPath());
        this.notify('child_removed', removePath);
    };

    /**
     * Replaces the current node by a new one. Copy all properties deeply
     * @param ajxpNode AjxpNode
     * @param metaMerge
     */

    AjxpNode.prototype.replaceBy = function replaceBy(ajxpNode, metaMerge) {
        this._isLeaf = ajxpNode._isLeaf;
        if (ajxpNode.getPath() && this._path != ajxpNode.getPath()) {
            var originalPath = this._path;
            if (this.getParent()) {
                var parentChildrenIndex = this.getParent()._children;
                parentChildrenIndex.set(ajxpNode.getPath(), this);
                parentChildrenIndex['delete'](originalPath);
            }
            this._path = ajxpNode.getPath();
            var pathChanged = true;
        }
        if (ajxpNode._label) {
            this._label = ajxpNode._label;
        }
        if (ajxpNode._icon) {
            this._icon = ajxpNode._icon;
        }
        if (ajxpNode._iNodeProvider) {
            this._iNodeProvider = ajxpNode._iNodeProvider;
        }
        //this._isRoot = ajxpNode._isRoot;
        this._isLoaded = ajxpNode._isLoaded;
        this.fake = ajxpNode.fake;
        var meta = ajxpNode.getMetadata();
        if (metaMerge == 'override') this._metadata = new Map();
        meta.forEach((function (value, key) {
            if (metaMerge == 'override') {
                this._metadata.set(key, value);
            } else {
                if (this._metadata.has(key) && value === '') {
                    return;
                }
                this._metadata.set(key, value);
            }
        }).bind(this));
        if (pathChanged && !this._isLeaf && this.getChildren().size) {
            window.setTimeout((function () {
                this.reload(this._iNodeProvider);
            }).bind(this), 100);
            return;
        }
        ajxpNode.getChildren().forEach((function (child) {
            this.addChild(child);
        }).bind(this));
        this.notify('node_replaced', this);
    };

    /**
     * Finds a child node by its path
     * @param path String
     * @returns AjxpNode
     */

    AjxpNode.prototype.findChildByPath = function findChildByPath(path) {
        return this._children.get(path);
    };

    /**
     * Sets the metadata as a bunch
     * @param data Map A Map
     */

    AjxpNode.prototype.setMetadata = function setMetadata(data) {
        this._metadata = data;
    };

    /**
     * Gets the metadat
     * @returns Map
     */

    AjxpNode.prototype.getMetadata = function getMetadata() {
        return this._metadata;
    };

    /**
     * Is this node a leaf
     * @returns Boolean
     */

    AjxpNode.prototype.isLeaf = function isLeaf() {
        return this._isLeaf;
    };

    /**
     * @returns String
     */

    AjxpNode.prototype.getPath = function getPath() {
        return this._path;
    };

    /**
     * @returns String
     */

    AjxpNode.prototype.getLabel = function getLabel() {
        return this._label;
    };

    /**
     * @returns String
     */

    AjxpNode.prototype.getIcon = function getIcon() {
        return this._icon;
    };

    /**
     * @returns Boolean
     */

    AjxpNode.prototype.isRecycle = function isRecycle() {
        return this.getAjxpMime() == 'ajxp_recycle';
    };

    /**
     * Search the mime type in the parent branch
     * @param ajxpMime String
     * @returns Boolean
     */

    AjxpNode.prototype.hasAjxpMimeInBranch = function hasAjxpMimeInBranch(ajxpMime) {
        if (this.getAjxpMime() == ajxpMime.toLowerCase()) {
            return true;
        }var parent,
            crt = this;
        while (parent = crt._parentNode) {
            if (parent.getAjxpMime() == ajxpMime.toLowerCase()) {
                return true;
            }
            crt = parent;
        }
        return false;
    };

    /**
     * Search the mime type in the parent branch
     * @returns Boolean
     * @param metadataKey
     * @param metadataValue
     */

    AjxpNode.prototype.hasMetadataInBranch = function hasMetadataInBranch(metadataKey, metadataValue) {
        if (this.getMetadata().has(metadataKey)) {
            if (metadataValue) {
                return this.getMetadata().get(metadataKey) == metadataValue;
            } else {
                return true;
            }
        }
        var parent,
            crt = this;
        while (parent = crt._parentNode) {
            if (parent.getMetadata().has(metadataKey)) {
                if (metadataValue) {
                    return parent.getMetadata().get(metadataKey) == metadataValue;
                } else {
                    return true;
                }
            }
            crt = parent;
        }
        return false;
    };

    /**
     * Sets a reference to the parent node
     * @param parentNode AjxpNode
     */

    AjxpNode.prototype.setParent = function setParent(parentNode) {
        this._parentNode = parentNode;
    };

    /**
     * Gets the parent Node
     * @returns AjxpNode
     */

    AjxpNode.prototype.getParent = function getParent() {
        return this._parentNode;
    };

    /**
     * Finds this node by path if it already exists in arborescence
     * @param rootNode AjxpNode
     * @param fakeNodes AjxpNode[]
     * @returns AjxpNode|undefined
     */

    AjxpNode.prototype.findInArbo = function findInArbo(rootNode, fakeNodes) {
        if (!this.getPath()) {
            return;
        }var pathParts = this.getPath().split('/');
        var crtPath = '';
        var crtNode,
            crtParentNode = rootNode;
        for (var i = 0; i < pathParts.length; i++) {
            if (pathParts[i] == '') continue;
            crtPath = crtPath + '/' + pathParts[i];
            var node = crtParentNode.findChildByPath(crtPath);
            if (node && !(node instanceof String)) {
                crtNode = node;
            } else {
                if (fakeNodes === undefined) {
                    return undefined;
                }crtNode = new AjxpNode(crtPath, false, PathUtils.getBasename(crtPath));
                crtNode.fake = true;
                crtNode.getMetadata().set('text', PathUtils.getBasename(crtPath));
                fakeNodes.push(crtNode);
                crtParentNode.addChild(crtNode);
            }
            crtParentNode = crtNode;
        }
        return crtNode;
    };

    /**
     * @returns Boolean
     */

    AjxpNode.prototype.isRoot = function isRoot() {
        return this._isRoot;
    };

    /**
     * Check if it's the parent of the given node
     * @param node AjxpNode
     * @returns Boolean
     */

    AjxpNode.prototype.isParentOf = function isParentOf(node) {
        var childPath = node.getPath();
        var parentPath = this.getPath();
        return childPath.substring(0, parentPath.length) == parentPath;
    };

    /**
     * Check if it's a child of the given node
     * @param node AjxpNode
     * @returns Boolean
     */

    AjxpNode.prototype.isChildOf = function isChildOf(node) {
        var childPath = this.getPath();
        var parentPath = node.getPath();
        return childPath.substring(0, parentPath.length) == parentPath;
    };

    /**
     * Gets the current's node mime type, either by ajxp_mime or by extension.
     * @returns String
     */

    AjxpNode.prototype.getAjxpMime = function getAjxpMime() {
        if (this._metadata && this._metadata.has('ajxp_mime')) {
            return this._metadata.get('ajxp_mime').toLowerCase();
        }if (this._metadata && this.isLeaf()) {
            return PathUtils.getAjxpMimeType(this._metadata).toLowerCase();
        }return '';
    };

    return AjxpNode;
})(Observable);