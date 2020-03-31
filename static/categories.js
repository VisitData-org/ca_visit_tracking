String.prototype.padding = function (n, c) {
    var val = this.valueOf();
    if (Math.abs(n) <= val.length) {
        return val;
    }
    var m = Math.max((Math.abs(n) - this.length) || 0, 0);
    var pad = Array(m + 1).join(String(c || ' ').charAt(0));
    return (n < 0) ? pad + val : val + pad;
};


var Essentializer = (function () {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

        function handleCategory(parentEssential, essentialMap, category, depth) {
            var categoryName = category.name;
            var categoryId = category.id;

            if (essentialMap.has(categoryId)) {
                console.error(categoryId + " already exists in the map for categoryName " + categoryName);
            }

            var essential = category.essential;

            if (!essential) {
                essential = parentEssential;
            } else {
                essential = JSON.parse(essential);
            }

            essentialMap.set(categoryId, essential);

            var subcategories = category.categories;
            if (!subcategories) {
                subcategories = [];
            }

            var indent = 2 * depth
            // console.log("".padding(indent) + categoryName.padding(45 - indent) + categoryId + " " + essential);

            for (var subcategoryIndex = 0; subcategoryIndex < subcategories.length; subcategoryIndex++) {
                var subcategory = subcategories[subcategoryIndex];
                handleCategory(essential, essentialMap, subcategories[subcategoryIndex], depth + 1);
            }
        }

        var categoryIdToEssentialMap = new Map();
        var categoryIdToCategoryMap = new Map();

        //   var privateVariable = "Im also private";
        var taxonomy = require("./data/taxonomy.json");
        for (categoryIndex = 0; categoryIndex < taxonomy.length; categoryIndex++) {
            var nextCategory = taxonomy[categoryIndex];
            categoryIdToCategoryMap.set(nextCategory.id, nextCategory);
            handleCategory(null, categoryIdToEssentialMap, nextCategory, 0);
        }

        return {

            // Public methods and variables
            isCategoryEssential: function (categoryId) {
                return categoryIdToEssentialMap.get(categoryId);
            },

            // publicProperty: "I am also public"
        };

    };

    return {

        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {

            if (!instance) {
                instance = init();
            }

            return instance;
        }

    };

})();

var essentializer = Essentializer.getInstance();
// example usage using my raw categories which is the category ID and name from the raw.csv file
var rawCategories = require("./data/raw_categories.json");
for (var rawCatIndex = 0; rawCatIndex < rawCategories.length; rawCatIndex++) {
    var rawCategory = rawCategories[rawCatIndex];
    var rawCategoryName = rawCategory.categoryName;
    var rawCategoryId = rawCategory.categoryId;
    var isEssential = essentializer.isCategoryEssential(rawCategoryId);
    // console.log(rawCategoryName.padding(30) + " is " + isEssential);
    console.log('"' + rawCategoryId + '","' + rawCategoryName + '","' + isEssential + '"');
}
