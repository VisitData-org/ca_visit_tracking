String.prototype.padding = function (n, c) {
    const val = this.valueOf();
    if (Math.abs(n) <= val.length) {
        return val;
    }
    const m = Math.max((Math.abs(n) - this.length) || 0, 0);
    const pad = Array(m + 1).join(String(c || ' ').charAt(0));
    return (n < 0) ? pad + val : val + pad;
};


// Instance stores a reference to the Singleton
function handleCategory(parentEssential, essentialMap, category, depth) {
    const categoryName = category.name;
    const categoryId = category.id;

    if (essentialMap.has(categoryId)) {
        console.error(categoryId + " already exists in the map for categoryName " + categoryName);
    }

    let essential = category.essential;

    if (!essential) {
        essential = parentEssential;
    } else {
        essential = JSON.parse(essential);
    }

    essentialMap.set(categoryId, essential);

    let subcategories = category.categories;
    if (!subcategories) {
        subcategories = [];
    }

    const indent = 2 * depth
    // console.log("".padding(indent) + categoryName.padding(45 - indent) + categoryId + " " + essential);

    for (let subcategoryIndex = 0; subcategoryIndex < subcategories.length; subcategoryIndex++) {
        const subcategory = subcategories[subcategoryIndex];
        handleCategory(essential, essentialMap, subcategories[subcategoryIndex], depth + 1);
    }
}

const categoryIdToEssentialMap = new Map();
const categoryIdToCategoryMap = new Map();

function isCategoryEssential(categoryId) {
    return categoryIdToEssentialMap.get(categoryId);
}

$.ajax({
    url: _fourSquareDataUrl + "/taxonomy.json" ,
    dataType: 'json',
    async: false,
    success: function (data) {
        console.debug("loading essential map");
        for (categoryIndex = 0; categoryIndex < data.length; categoryIndex++) {
            const nextCategory = data[categoryIndex];
            categoryIdToCategoryMap.set(nextCategory.id, nextCategory);
            handleCategory(null, categoryIdToEssentialMap, nextCategory, 0);
        }
        console.debug("loaded essential map");
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
