var Node       = Y.Node,
    getDOMNode = Node.getDOMNode,
    Array_each = Y.Array.each,
    
    NodeList = Y.Collection.build( Node,
    // config
    {
        whitelist: [
            'append',
            'detach',
            'detachAll',
            'insert',
            'prepend',
            'remove',
            'removeAttribute',
            'set',
            'setContent'
        ]
    },
    
    // prototype
    {
        _construct: function ( nodes ) {
            if ( typeof nodes === 'string' ) {
                this._query = nodes;
                nodes = Y.Selector.query( nodes );
            } else if ( nodes.nodeType || nodes instanceof Node ) {
                nodes = [ getDOMNode( nodes ) ];
            } else {
                // array of DOM nodes or Node instances
                Array_each( nodes, function ( node, i ) {
                    nodes[i] = getDOMNode( node );
                });
            }

            NodeList._instances[ Y.stamp( this ) ] = this;

            NodeList.superclass._construct.call( this, nodes );
            this._nodes = this._items;
        },

        item: function ( i ) {
            var node = this._items[i];
            return node ? Y.one( node ) : null;
        },

        _item: function ( i ) {
            var node = this._items[i] || null;

            if (node) {
                node = Node._instances[ node._yuid ] ||
                       NodeList._getTempNode( node );
            }

            return node;
        },

        indexOf: function ( node ) {
            return Y.Array.indexOf( this._items, getDOMNode( node ) );
        },

        toFrag: function () {
            return Y.one( Y.DOM._nl2frag( this._items ) );
        },

        filter: function ( selector ) {
            return Y.Lang.isFunction( selector ) ?
                NodeList.superclass.filter.apply( this, arguments ) :
                Y.all( Y.Selector.filter( this._items, selector ) );
        },

        destructor: function() {
            delete NodeList._instances[this._yuid];
        },

        refresh: function() {
            var nodes = this._items,
                query = this._query,
                root  = this._queryRoot;

            if (query) {
                if (!root) {
                    if (nodes && nodes[0] && nodes[0].ownerDocument) {
                        root = nodes[0].ownerDocument;
                    }
                }

                this._nodes = Y.Selector.query(query, root);
            }

            return this;
        },

        on: function () {
            var args = Y.Array( arguments, 0, true );
            args.splice( 2, 1, this._items, args[2] || this );
            return Y.on.apply( Y, args );
        },

        after: function () {
            var args = Y.Array( arguments, 0, true );
            args.splice( 2, 1, this._items, args[2] || this );
            return Y.after.apply( Y, args );
        },

        toString: function() {
            var str = '',
                errorMsg = this._yuid + ': not bound to any nodes',
                nodes    = this._items,
                node;

            if (nodes && nodes[0]) {
                node = nodes[0];
                str += node.nodeName;
                if (node.id) {
                    str += '#' + node.id; 
                }

                if (node.className) {
                    str += '.' + node.className.replace(/\s+/g, '.'); 
                }

                if (nodes.length > 1) {
                    str += '...[' + nodes.length + ' items]';
                }
            }
            return str || errorMsg;
        },

        get: function ( attr ) {
            var nodes      = this._items,
                isNodeList = false,
                scrub      = Node.scrubVal,
                ret        = [];

            if ( nodes[0] ) {
                isNodeList = getDOMNode( this._item( 0 )._get( attr ) );

                Array_each( nodes, function ( node, i ) {
                    node = this._item( i );

                    var val = node._get( attr );
                    if ( !isNodeList ) { // convert array of Nodes to NodeList
                        val = scrub( val, node );
                    }

                    ret.push( val );
                }, this);
            }

            return ( isNodeList ) ? Y.all( ret ) : ret;
        },

        add: function ( node ) {
            return NodeList.superclass.add.call( this, getDOMNode( node ) );
        },

        remove: function ( node ) {
            return NodeList.superclass.remove.call( this, getDOMNode( node ) );
        }
    },

    // statics
    {
        NAME: 'nodeList',

        getDOMNodes: function( nodeList ) {
            return nodeList._items;
        },

        _instances: [],

        _getTempNode: function ( el ) {
            var tmp = NodeList._tempNode;

            if ( !tmp ) {
                NodeList._tempNode = tmp = Node.create('<div></div>');
            }

            tmp._node = tmp._stateProxy = el;

            return tmp;
        }
    });

Y.all    = // chained assigment
Node.all = function ( nodes ) {
    return new NodeList( nodes );
};

Y.NodeList = NodeList;
