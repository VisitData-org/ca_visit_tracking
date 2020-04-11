String.prototype.padding = function (n, c) {
    var val = this.valueOf();
    if (Math.abs(n) <= val.length) {
        return val;
    }
    var m = Math.max((Math.abs(n) - this.length) || 0, 0);
    var pad = Array(m + 1).join(String(c || ' ').charAt(0));
    return (n < 0) ? pad + val : val + pad;
};


// Instance stores a reference to the Singleton
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

function isCategoryEssential(categoryId) {
    return categoryIdToEssentialMap.get(categoryId);
}

//   var privateVariable = "Im also private";
$.getJSON(_fourSquareDataUrl + "/taxonomy.json", function (data) {
    for (categoryIndex = 0; categoryIndex < data.length; categoryIndex++) {
        var nextCategory = data[categoryIndex];
        categoryIdToCategoryMap.set(nextCategory.id, nextCategory);
        handleCategory(null, categoryIdToEssentialMap, nextCategory, 0);
    }
});

// TODO remove code for prepping the categories and taxonomy

// here is the code i used to shred the categories.  It shouldn't be in here so I will move it later

// function handleCategoryForLogging(category) {
//     console.log(category.id+','+category.name+','+isCategoryEssential(category.id));
//     var subcategories = category.categories;
//     for(var i=0; i<subcategories.length; i++) {
//         handleCategoryForLogging(subcategories[i]);
//     }
// }

// for (var categoryIndex = 0; categoryIndex < taxonomy.length; categoryIndex++) {
//     var nextCategory = taxonomy[categoryIndex];
//     handleCategoryForLogging(nextCategory);
// }