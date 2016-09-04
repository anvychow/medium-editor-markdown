"use strict";

/**
 * MeMarkdown
 * Creates a new instance of `MeMarkdown`.
 *
 * @name MeMarkdown
 * @function
 * @param {Object} options An object containing the following fields:
 *
 *  - `events` (Array): An array with the events when the markdown code will be generated (default: `["input", "change"]`).
 *  - `callback` (Function): The callback function. If the second argument is a function, then it has greater priority.
 *  - `toMarkdownOptions` (Object): Options to pass to the markdown converter code.
 *
 * @param {Function} callback The callback function that is called with the markdown code (first argument).
 */

var toMarkdown = require('to-markdown');

module.exports = function (options, callback) {

    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    // Defaults
    options = Object(options);
    options.events = options.events || ["input", "change"];
    callback = callback || options.callback || function () {};

    var toMarkdownOptions = options.toMarkdownOptions = Object(options.toMarkdownOptions);
    toMarkdownOptions.converters = toMarkdownOptions.converters || [];

    if (!options.ignoreBuiltInConverters) {
        toMarkdownOptions.converters.push({
            filter: function (node) {
                return node.nodeName === "DIV" && !node.attributes.length;
            }
          , replacement: function (content) {
                return content;
            }
        });
    }

    function normalizeList ($elm) {
        var $children = $elm.children;
        for (var i = 0; i < $children.length; ++i) {
            var $cChild = $children[i];
            var $br = $cChild.querySelector("br");
            $br && $br.remove();
            !$cChild.innerHTML.trim() && $cChild.remove();
            var $prevChild = $children[i - 1];
            if (/^UL|OL$/.test($cChild.tagName)) {
                try {
                    $prevChild.appendChild($cChild);
                } catch (e) { console.warn(e); }
                normalizeList($cChild);
            }
        }
    }

    // Called by medium-editor during init
    this.init = function () {

        // If this instance of medium-editor doesn't have any elements, there's nothing for us to do
        if (!this.base.elements || !this.base.elements.length) {
            return;
        }

        // Element(s) that this instance of medium-editor is attached to is/are stored in .elements
        this.element = this.base.elements[0];

        var handler = function () {
            var $clone = this.element.cloneNode(true);
            var $lists = $clone.querySelectorAll("ul, ol");
            for (var i = 0; i < $lists.length; ++i) {
                normalizeList($lists[i]);
            }

            callback(toMarkdown($clone.innerHTML, options.toMarkdownOptions).split("\n").map(function (c) {
                return c.trimRight();
            }).join("\n").trimRight());
        }.bind(this);

        options.events.forEach(function (c) {
            this.element.addEventListener(c, handler);
        }.bind(this));

        handler();
    };
};
