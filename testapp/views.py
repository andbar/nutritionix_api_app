import requests
import json
import re

from flask import render_template, jsonify, redirect, url_for
from testapp import app

# This function sends a post request to Nutritionix API and returns the response
# Pass in a different offset to change the starting point for the results
def get_api_data(offset=0):
    url = 'https://api.nutritionix.com/v1_1/search'
    headers = {"Content-Type": "application/json"}
    data = {
            "appId": app.config['NUTRITIONIX_APPID'],
            "appKey": app.config['NUTRITIONIX_APPKEY'],
            "fields": [
                "item_name",
                "nf_serving_size_unit",
                "nf_serving_size_qty",
                "nf_calories",
                "nf_ingredient_statement"
            ],
            "offset": offset, # The starting point in the results set
            "limit": 50, # 50 is the max allowed for number of results returned
            "filters": {
                "brand_id": "51db37d0176fe9790a899db2" # Juicy Juice brand
            },
    }
    response = requests.post(url, data=json.dumps(data), headers=headers)
    return response

# This function returns a list of all the products from the api request along
# with the total count of the number of products.
def get_products_from_api_response():
    json_response = get_api_data().json()
    total_products = json_response['total']
    products = json_response['hits']
    offset = 50
    while offset < total_products:
        products += get_api_data(offset=offset).json()['hits']
        offset += 50
    return products, total_products

PRODUCTS, TOTAL_PRODUCTS = get_products_from_api_response()

# This function returns average calories per ounce for all Juicy Juice products
# Note that only products with serving size unit of 'fl oz' or 'oz' are included
def get_average_calories_per_ounce(product_list):
    calories_per_ounce = []
    for product in product_list:
        if product['fields']['nf_serving_size_unit'] in ['fl oz', 'oz']:
            calories_per_ounce.append(product['fields']['nf_calories']/product['fields']['nf_serving_size_qty'])
    average_calories_per_ounce = sum(calories_per_ounce)/len(calories_per_ounce)
    return average_calories_per_ounce

AVG_CALORIES = get_average_calories_per_ounce(PRODUCTS)

# This function satisfies part 3) of the technical test - it returns, 1: a list
# of all products as a dictionary, including a cleaned list of ingredients, and
# 2: a dictionary of each ingredient with a list of products containing it
def get_ingredients(product_list):
    ingredients_dict = {}
    for product in product_list:
        if product['fields']['nf_ingredient_statement']:
            product['fields']['ingredients'] = re.sub(
                r"\.|(and )|(\s\([\w\s,]+\)|(L?l?ess than \d?\.?\d?% )(of )?)",
                "",
                product['fields']['nf_ingredient_statement'])
            product['fields']['ingredients'] = product['fields']['ingredients'].split(", ")
            for ingredient in product['fields']['ingredients']:
                if ingredient in ingredients_dict:
                    if product['fields']['item_name'] not in ingredients_dict[ingredient]:
                        ingredients_dict[ingredient].append(product['fields']['item_name'])
                else:
                    ingredients_dict[ingredient] = [product['fields']['item_name']]
    return product_list, ingredients_dict

PRODUCTS_INGREDIENTS, INGREDIENTS = get_ingredients(PRODUCTS)

### THESE ARE THE VIEWS THAT RETURN THE DATA FROM THE ABOVE FUNCTIONS ###

# This view satisfies parts 1) and 2) from the technical test. It returns JSON
# of brand name, item count, and average calories
@app.route('/api/summary')
def api_summary():
    return jsonify(brand_name="Juicy Juice", total_items=TOTAL_PRODUCTS, avg_calories_per_oz=AVG_CALORIES)

# This view satisfies part 4) of the technical test. It displays a dashboard
# view that uses main.js to show ingredient info from the ingredients api below
@app.route('/dashboard/')
def dashboard_view():
    return render_template('dashboard.html')

# This view is used by the dashboard view. It returns JSON of the ingredients
# dictionary (key: ingredient, value: list of products containing ingredient)
@app.route('/api/ingredients/')
def api_ingredients():
    return jsonify(**INGREDIENTS)

# Returns a basic template view with the info from the ingredients dictionary
@app.route('/ingredients/')
def ingredients_view():
    return render_template('ingredients.html', ingredients=INGREDIENTS)

# Returns JSON of products, including list of ingredients
@app.route('/api/products/')
def api_products():
    data = {"products": PRODUCTS_INGREDIENTS}
    return jsonify(**data)

# Returns a basic template view of the products
@app.route('/')
@app.route('/products/')
def products_view():
    return render_template('products.html', hits=PRODUCTS_INGREDIENTS, total=TOTAL_PRODUCTS, average=AVG_CALORIES)

# Returns a basic template view of particular products
@app.route('/products/<product_name>')
def product_details(product_name):
    product = None
    for item in PRODUCTS_INGREDIENTS:
        if item['fields']['item_name'] == product_name:
            product = item
    if product:
        return render_template('product_details.html', product=product)
    else:
        return redirect(url_for('products_view'))
