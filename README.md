# Juicy Juicy Products from the Nutritionix API

This is a small Flask app that gets all the Juicy Juice products from the Nutritionix API and interacts with the data.

It was built with Python 3.5 and has not been tested with other versions of Python (see also requirements.txt).

## Data
For this project, after getting the data from the api, I simply interact with it in the views.py file, building a list of all the products along with their info from the JSON response, and getting a dictionary of all the ingredients along with a list of the products containing that ingredient. I didn't build a database for this particular project.

## URLs
The url pattern ('/api/summary') will return a JSON response of the brand name (Juicy Juice), the total number of products for that brand returned from the Nutritionix API, and the average calories per ounce for those products. Note that only some of the products contained relevant info for calculating the average calories (had to have 'fl oz' or 'oz' as the serving size unit).

The url pattern ('/ingredients/') returns a basic template view with each ingredient and the list of products which contain that ingredient.

The url pattern ('/api/ingredients/') returns a JSON response of that same information.

The url pattern ('/dashboard/') returns a data dashboard visualizing the ingredient info. It uses D3.js to create a bubble chart of the ingredients based on their product count, a bar graph of the top 10 most frequent ingredients, and a list of the products which contain a particular ingredient. Note that when the page loads it sets the product list to show the products containing the most frequent ingredient, but the list changes when you click on one of the circles in the bubble chart. You can also click on the product name to go to a basic template view of the product with some further details.

## Two other notes:

1) The data from the Nutritionix API is a bit dirty (as most data is!). For example, one product shows Beat Carotene as an ingredient which should most certainly be Beta Carotene. Another one shows Banana Pure instead of Banana Puree. So the results when I cleaned the ingredient statements aren't perfect.

2) This is definitely not a finished app. I started building it to satisfy the requirements of a technical test, and it's been a great way to keep learning JavaScript and start learning D3.js.
