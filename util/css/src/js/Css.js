/*

NOTES
 * Can't use Y.Node because n.get('sheet') fails because the return type is
   StyleSheet (non-basic type)
 * Style node must be added to the head element.  Safari does not honor styles
   applied to StyleSheet objects on style nodes in the body.
 * StyleSheet object is created on the style node when the style node is added
   to the head element in at least Safari.
 * Cannot cache the cssRules collection because Safari replaces it between
   updates.  Must drill to rule from the StyleSheet object every time.
 * Opera requires that the index be passed with insertRule.

*/

var styleNode,sheet,cssRules,ruleIdx,remove,_add,_set,_unset,_pending,_init,_ruleIndex,_reindex;

/**
 * style node housing the dynamic stylesheet.
 * @type HTMLStyleElement
 * @private
 */
styleNode = document.createElement('style');
styleNode.type="text/css";

/**
 * Selector text -> cssRules rule index map to prevent having to iterate
 * the cssRules for each (un)set operation.
 * @type Object
 * @private
 */
ruleIdx = {};

/**
 * Flag used when _init() fails (before head element is ready?) and _init
 * is scheduled for onDOMReady.
 * @type boolean
 * @private
 */
_pending = false;

/**
 * Add the style node to the head element. Capture the StyleSheet object.
 * Transfer any rules cached in the placeholder sheet to the real
 * StyleSheet object.  If the DOM is not in a state ready to use, a
 * reattempt is scheduled onDOMReady.
 * @private
 */
_init = function () {
    if (styleNode.parentNode) { return true; }
    if (_pending) { return false; }

    try {
        // TODO: Include configuration for where to insert the node w/i head
        // TODO: Account for no head element
        document.getElementsByTagName('head')[0].appendChild(styleNode);

        var rules = sheet.rules,
            i = 0, l = rules.length;

        // styleSheet object is exposed after the node is added to the head.
        // Replace the placeholder sheet with the genuine article.
        sheet = styleNode.styleSheet || styleNode.sheet;

        // Reconfigure the identifiers and rule addition wrapper for W3C
        // compliant browsers.
        if (sheet.insertRule) {
            cssRules = 'cssRules';
            remove = 'deleteRule';
            _add = function (sel,idx) {
                sheet.insertRule(sel+' {}',idx);
                ruleIdx[sel] = idx;
            };
        }

        // TODO: this should be pulled outside this try block to avoid
        // incorrect onDOMReady scheduling in the case of a bogus assignment

        // Transfer rules from placeholder sheet to the StyleSheet
        for (;i<l;++i) {
            Y.CSS.set(rules[i].selectorText, rules[i].style);
        }
    }
    catch (e) {
        _pending = true;
        Y.Event.onDOMReady(function () { _pending = false; _init(); });
    }
};

/**
 * Placeholder faux-StyleSheet to support a functional API before the
 * style node can be added to head and the StyleSheet can be extracted.
 * Safari doesn't create the StyleSheet object until the style node is added
 * to the head.
 * @type StyleSheet
 * @private
 */
sheet = {
    rules      : [],
    addRule    : function (sel,css) {
        sheet.rules.push({selectorText:sel,style:{}});
        _init(); // initialize the API and live node structure (if possible)
    },
    removeRule : function (idx) {
        sheet.splice(idx,1);
        _init(); // initialize the API and live node structure (if possible)
    }
};

/**
 * The name of the cssRules collection on the StyleSheet object.
 * 'rules' for IE & Safari, 'cssRules' for Safari (also) and others.
 * This is redefined in _init if needed.
 * @type String
 * @private
 */
cssRules = 'rules';

/**
 * The name of the rule removal method on the StyleSheet object.
 * 'removeRule' for IE & Safari. 'deleteRule' for Safari (also) and others.
 * This is redefined in _init if needed.
 * @type String
 * @private
 */
remove = 'removeRule';

/**
 * Wrapper function for the rule addition method on the StyleSheet object.
 * IE & Safari support addRule(sel,cssText), Safari and others support
 * insertRule(selAndCssText, index).  This is redefined in _init if needed.
 * @private
 */
_add = function (sel,i) {
    sheet.addRule(sel, '{clip:auto}');
    ruleIdx[sel] = i;
};

/**
 * Apply the style properties to the rule
 * @param style {StyleCollection} the rule's style object
 * @param props {Object} properties and their corresponding values to set
 * @private
 */
_set = function (style,props) {
    props = Y.clone(props);
    var p, owns = Y.Object.owns;

    // TODO: move to load-time fork
    if ('opacity' in props && !('opacity' in style)) {
        props.filter = 'alpha(opacity='+(props.opacity * 100)+')';
        delete props.opacity;
    }
    if ('cssFloat' in props || 'styleFloat' in props) {
        if ('cssFloat' in style) {
            props.cssFloat = props.cssFloat || props.styleFloat;
            delete props.styleFloat;
        } else {
            props.styleFloat = props.styleFloat || props.cssFloat;
            delete props.cssFloat;
        }
    }

    for (p in props) {
        if (owns(props,p) && p in style) { // FF2 hasOwnProp false for styles
            style[p] = props[p];
        }
    }
};

/**
 * Reset the property assignment to its default value.
 * @param style {StyleCollection} the rule's style object
 * @param prop {String|Array} the property name or list of property names
 * @private
 */
_unset = function (style,prop) {
    var i, p;

    prop = Y.Array(prop);

    for (i = prop.length - 1; i >= 0; --i) {
        p = prop[i];
        // TODO: move to load-time fork
        if (p === 'opacity' && !('opacity' in style)) {
            p = 'filter';
        } else if (p === 'cssFloat' || p === 'styleFloat') {
            p = 'cssFloat' in style ? 'cssFloat' : 'styleFloat';
        }

        if (p in style) {
            style[p] = ''; // TODO: verify this works for each prop
        }
    }
};

/**
 * Brute force search through the StyleSheet cssRules collection for the
 * first (and should be only) rule with selectorText matching sel.
 * @param sel {String} selector text for the needle's rule
 * @private
 */
_ruleIndex = function (sel) {
    var rules = sheet[cssRules],
        i = rules.length - 1;

    for (;i>=0;--i) {
        if (rules[i].selectorText == sel) {
            return i;
        }
    }

    return undefined;
};

/**
 * Reindex the ruleIdx map. Used when a rule is removed.
 * @param i {int} (optional) starting index in the cssRules collection
 *                to reindex from.
 * @private
 */
_reindex = function (i) {
    i |= 0;
    for (var l = sheet[cssRules].length; i<l; ++i) {
        ruleIdx[sheet[cssRules][i].selectorText] = i;
    }
};


Y.CSS = {
    /**
     * Set style rule properties. If a rule is not found for the selector
     * text, a new rule is created.
     * @method set
     * @static
     * @param sel {String} css selector for style rules
     * @param props {Object} Object literal of style properties and the desired
     *                       values.  Keys must be in camel cased DOM notation.
     * @return {YUI object} The owning YUI instance
     */
    set : function (sel, props) {
        var i = ruleIdx[sel];
        if (i === undefined) {
            i = sheet[cssRules].length;
            _add(sel,i);
        }

        // Verify the index
        if (sheet[cssRules][i].selectorText != sel) {
            i = ruleIdx[sel] = _ruleIndex(sel);
        }
        if (i !== undefined) {
            _set(sheet[cssRules][i].style,props);
        }

        return Y;
    },

    /**
     * Unset style rule properties or remove a style rule entirely.
     * @method unset
     * @static
     * @param sel {String} css selector for the style rules
     * @param props {String|Array} (optional) unset only this/these properties
     * @return {YUI object} The owning YUI instance
     */
    unset : function (sel, props) {
        var i = ruleIdx[sel];

        // Verify the rule index
        if (i === undefined || sheet[cssRules][i].selectorText != sel) {
            i = _ruleIndex(sel);
        }
        if (i !== undefined) {
            if (props) {
                _unset(sheet[cssRules][i].style,props);
            } else {
                sheet[remove](i);
                delete ruleIdx[sel];
                _reindex(i);
            }
        }

        return Y;
    }
};
