const DB = {
    restaurants: [
        {
            id: 1,
            name: "Spice Symphony",
            rating: 4.5,
            deliveryTime: "30-40 mins",
            cuisine: "North Indian, Chinese",
            location: "Khandagiri",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop", 
            menu: [
                { id: 101, name: "Butter Chicken", price: 350, type: "non-veg", description: "Rich creamy tomato gravy with tender chicken", image: "https://tse2.mm.bing.net/th?q=Butter+Chicken+curry&w=200&h=200&c=7" },
                { id: 102, name: "Dal Makhani", price: 280, type: "veg", description: "Black lentils simmered overnight with butter and cream", image: "https://tse2.mm.bing.net/th?q=Dal+Makhani&w=200&h=200&c=7" },
                { id: 103, name: "Paneer Tikka", price: 300, type: "veg", description: "Cottage cheese marinated in spices and grilled", image: "https://tse2.mm.bing.net/th?q=Paneer+Tikka&w=200&h=200&c=7" },
                { id: 104, name: "Garlic Naan", price: 60, type: "veg", description: "Leavened bread topped with garlic and butter", image: "https://tse2.mm.bing.net/th?q=Garlic+Naan&w=200&h=200&c=7" },
                { id: 105, name: "Chicken Biryani", price: 400, type: "non-veg", description: "Aromatic basmati rice cooked with spiced chicken", image: "https://tse2.mm.bing.net/th?q=Chicken+Biryani&w=200&h=200&c=7" }
            ]
        },
        {
            id: 2,
            name: "Burger Bistro",
            rating: 4.2,
            deliveryTime: "25-35 mins",
            cuisine: "American, Fast Food",
            location: "Patia",
            image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 201, name: "Classic Cheeseburger", price: 180, type: "non-veg", description: "Juicy beef patty with cheddar cheese", image: "https://tse2.mm.bing.net/th?q=Cheeseburger&w=200&h=200&c=7" },
                { id: 202, name: "Veggie Supreme Burger", price: 160, type: "veg", description: "Crispy vegetable patty with fresh greens", image: "https://tse2.mm.bing.net/th?q=Veggie+Burger&w=200&h=200&c=7" },
                { id: 203, name: "Peri Peri Fries", price: 120, type: "veg", description: "Crispy fries tossed in spicy peri peri mix", image: "https://tse2.mm.bing.net/th?q=Peri+Peri+Fries&w=200&h=200&c=7" },
                { id: 204, name: "Chicken Wings (6pcs)", price: 250, type: "non-veg", description: "Spicy buffalo wings served with ranch", image: "https://tse2.mm.bing.net/th?q=Buffalo+Chicken+Wings&w=200&h=200&c=7" },
                { id: 205, name: "Vanilla Shake", price: 150, type: "veg", description: "Thick creamy vanilla milkshake", image: "https://tse2.mm.bing.net/th?q=Vanilla+Milkshake&w=200&h=200&c=7" }
            ]
        },
        {
            id: 3,
            name: "Pizza Paradise",
            rating: 3.8,
            deliveryTime: "40-50 mins",
            cuisine: "Italian, Pizzas",
            location: "Ghatikia",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 301, name: "Margherita", price: 250, type: "veg", description: "Classic tomato sauce and mozzarella cheese", image: "https://tse2.mm.bing.net/th?q=Margherita+Pizza&w=200&h=200&c=7" },
                { id: 302, name: "Pepperoni Feast", price: 350, type: "non-veg", description: "Loaded with spicy pepperoni slices", image: "https://tse2.mm.bing.net/th?q=Pepperoni+Pizza&w=200&h=200&c=7" },
                { id: 303, name: "Farmhouse Special", price: 300, type: "veg", description: "Onion, bell pepper, mushroom and corn", image: "https://tse2.mm.bing.net/th?q=Farmhouse+Pizza&w=200&h=200&c=7" },
                { id: 304, name: "Garlic Breadsticks", price: 120, type: "veg", description: "Baked bread sticks with garlic butter", image: "https://tse2.mm.bing.net/th?q=Garlic+Breadsticks&w=200&h=200&c=7" },
                { id: 305, name: "Choco Lava Cake", price: 90, type: "veg", description: "Warm chocolate cake with molten center", image: "https://tse2.mm.bing.net/th?q=Choco+Lava+Cake&w=200&h=200&c=7" }
            ]
        },
        {
            id: 4,
            name: "Sushi Spot",
            rating: 4.8,
            deliveryTime: "45-55 mins",
            cuisine: "Japanese, Asian",
            location: "Patrapada",
            image: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 401, name: "California Roll", price: 450, type: "non-veg", description: "Crab, avocado, and cucumber", image: "https://tse2.mm.bing.net/th?q=California+Sushi+Roll&w=200&h=200&c=7" },
                { id: 402, name: "Avocado Maki", price: 300, type: "veg", description: "Simple avocado roll", image: "https://tse2.mm.bing.net/th?q=Avocado+Maki+Sushi&w=200&h=200&c=7" },
                { id: 403, name: "Salmon Sashimi", price: 500, type: "non-veg", description: "Fresh sliced salmon", image: "https://tse2.mm.bing.net/th?q=Salmon+Sashimi&w=200&h=200&c=7" },
                { id: 404, name: "Miso Soup", price: 150, type: "veg", description: "Traditional soybean paste soup", image: "https://tse2.mm.bing.net/th?q=Miso+Soup&w=200&h=200&c=7" },
                { id: 405, name: "Tempura Prawns", price: 400, type: "non-veg", description: "Crispy batter-fried prawns", image: "https://tse2.mm.bing.net/th?q=Tempura+Prawns&w=200&h=200&c=7" }
            ]
        },
        {
            id: 5,
            name: "China Town",
            rating: 4.0,
            deliveryTime: "30-45 mins",
            cuisine: "Chinese, Thai",
            location: "Baramunda",
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 501, name: "Hakka Noodles", price: 200, type: "veg", description: "Stir-fried noodles with mixed vegetables", image: "https://tse2.mm.bing.net/th?q=Veg+Hakka+Noodles&w=200&h=200&c=7" },
                { id: 502, name: "Chilli Chicken", price: 280, type: "non-veg", description: "Spicy chicken tossed with peppers and onions", image: "https://tse2.mm.bing.net/th?q=Chilli+Chicken+Dry&w=200&h=200&c=7" },
                { id: 503, name: "Spring Rolls", price: 150, type: "veg", description: "Crispy rolls filled with veggies", image: "https://tse2.mm.bing.net/th?q=Spring+Rolls+Food&w=200&h=200&c=7" },
                { id: 504, name: "Manchurian", price: 220, type: "veg", description: "Veg balls in spicy soya sauce gravy", image: "https://tse2.mm.bing.net/th?q=Veg+Manchurian&w=200&h=200&c=7" },
                { id: 505, name: "Fried Rice", price: 180, type: "veg", description: "Classic veg fried rice", image: "https://tse2.mm.bing.net/th?q=Veg+Fried+Rice&w=200&h=200&c=7" }
            ]
        },
        {
            id: 6,
            name: "Healthy Harvest",
            rating: 4.6,
            deliveryTime: "25-35 mins",
            cuisine: "Healthy, Salads",
            location: "Saheed Nagar",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 601, name: "Greek Salad", price: 250, type: "veg", description: "Lettuce, olives, cucumber, feta cheese", image: "https://tse2.mm.bing.net/th?q=Greek+Salad&w=200&h=200&c=7" },
                { id: 602, name: "Grilled Chicken Salad", price: 300, type: "non-veg", description: "Grilled chicken strips with fresh greens", image: "https://tse2.mm.bing.net/th?q=Grilled+Chicken+Salad&w=200&h=200&c=7" },
                { id: 603, name: "Quinoa Bowl", price: 280, type: "veg", description: "Nutritious quinoa with roasted veggies", image: "https://tse2.mm.bing.net/th?q=Quinoa+Bowl+Food&w=200&h=200&c=7" },
                { id: 604, name: "Green Smoothie", price: 150, type: "veg", description: "Spinach, banana, and almond milk blend", image: "https://tse2.mm.bing.net/th?q=Green+Smoothie&w=200&h=200&c=7" },
                { id: 605, name: "Fruit Parfait", price: 180, type: "veg", description: "Layers of yogurt, granola, and fresh fruits", image: "https://tse2.mm.bing.net/th?q=Fruit+Parfait&w=200&h=200&c=7" }
            ]
        },
        {
            id: 7,
            name: "Taco Fiesta",
            rating: 4.3,
            deliveryTime: "35-45 mins",
            cuisine: "Mexican",
            location: "Ghatikia KhaoGali",
            image: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 701, name: "Chicken Tacos", price: 200, type: "non-veg", description: "Soft shell tacos with seasoned chicken", image: "https://tse2.mm.bing.net/th?q=Chicken+Tacos&w=200&h=200&c=7" },
                { id: 702, name: "Veggie Burrito", price: 220, type: "veg", description: "Rice, beans, cheese wrapped in tortilla", image: "https://tse2.mm.bing.net/th?q=Veggie+Burrito&w=200&h=200&c=7" },
                { id: 703, name: "Nachos Supreme", price: 250, type: "veg", description: "Chips loaded with cheese, salsa and beans", image: "https://tse2.mm.bing.net/th?q=Nachos+Supreme&w=200&h=200&c=7" },
                { id: 704, name: "Quesadilla", price: 180, type: "veg", description: "Grilled tortilla filled with cheese", image: "https://tse2.mm.bing.net/th?q=Cheese+Quesadilla&w=200&h=200&c=7" },
                { id: 705, name: "Churros", price: 120, type: "veg", description: "Fried dough pastry with cinnamon sugar", image: "https://tse2.mm.bing.net/th?q=Churros&w=200&h=200&c=7" }
            ]
        },
        {
            id: 8,
            name: "South Coast",
            rating: 4.7,
            deliveryTime: "20-30 mins",
            cuisine: "South Indian",
            location: "Kalinga Nagar",
            image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=800&auto=format&fit=crop",
            menu: [
                { id: 801, name: "Masala Dosa", price: 180, type: "veg", description: "Crispy crepe filled with spiced potato", image: "https://tse2.mm.bing.net/th?q=Masala+Dosa&w=200&h=200&c=7" },
                { id: 802, name: "Idli Sambar", price: 120, type: "veg", description: "Steamed rice cakes with lentil stew", image: "https://tse2.mm.bing.net/th?q=Idli+Sambar&w=200&h=200&c=7" },
                { id: 803, name: "Vada", price: 100, type: "veg", description: "Fried donut-shaped lentil fritters", image: "https://tse2.mm.bing.net/th?q=Medu+Vada&w=200&h=200&c=7" },
                { id: 804, name: "Uttapam", price: 160, type: "veg", description: "Thick savory pancake with toppings", image: "https://tse2.mm.bing.net/th?q=Vegetable+Uttapam&w=200&h=200&c=7" },
                { id: 805, name: "Filter Coffee", price: 80, type: "veg", description: "Traditional South Indian hot coffee", image: "https://tse2.mm.bing.net/th?q=South+Indian+Filter+Coffee&w=200&h=200&c=7" }
            ]
        },
        {
            id: 9,
            name: "Dessert Dreams",
            rating: 4.9,
            deliveryTime: "20-40 mins",
            cuisine: "Bakery, Desserts",
            location: "SUM Road",
            image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
            menu: [
                 { id: 901, name: "Chocolate Truffle", price: 200, type: "veg", description: "Decadent chocolate cake slice", image: "https://tse2.mm.bing.net/th?q=Chocolate+Truffle+Cake+Slice&w=200&h=200&c=7" },
                 { id: 902, name: "Blueberry Muffin", price: 120, type: "veg", description: "Soft muffin with fresh blueberries", image: "https://tse2.mm.bing.net/th?q=Blueberry+Muffin&w=200&h=200&c=7" },
                 { id: 903, name: "Croissant", price: 150, type: "veg", description: "Buttery and flaky French pastry", image: "https://tse2.mm.bing.net/th?q=Butter+Croissant&w=200&h=200&c=7" },
                 { id: 904, name: "Macarons (3pcs)", price: 250, type: "veg", description: "Colorful almond meringue cookies", image: "https://tse2.mm.bing.net/th?q=Macarons&w=200&h=200&c=7" },
                 { id: 905, name: "Tiramisu", price: 300, type: "veg", description: "Coffee-flavoured Italian dessert", image: "https://tse2.mm.bing.net/th?q=Tiramisu+Slice&w=200&h=200&c=7" }
            ]
        },
        {
            id: 10,
            name: "Biryani Blues",
            rating: 4.4,
            deliveryTime: "30-50 mins",
            cuisine: "Biryani, Mughlai",
            location: "Naka Gate",
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop",
            menu: [
                 { id: 1001, name: "Hyderabadi Biryani", price: 350, type: "non-veg", description: "Spicy biryani with tender mutton", image: "https://tse2.mm.bing.net/th?q=Hyderabadi+Mutton+Biryani&w=200&h=200&c=7" },
                 { id: 1002, name: "Veg Dum Biryani", price: 280, type: "veg", description: "Vegetables cooked in layers of rice", image: "https://tse2.mm.bing.net/th?q=Veg+Biryani&w=200&h=200&c=7" },
                 { id: 1003, name: "Chicken 65", price: 300, type: "non-veg", description: "Spicy deep-fried chicken", image: "https://tse2.mm.bing.net/th?q=Chicken+65&w=200&h=200&c=7" },
                 { id: 1004, name: "Mirchi Ka Salan", price: 150, type: "veg", description: "Curry with green chilies and peanuts", image: "https://tse2.mm.bing.net/th?q=Mirchi+Ka+Salan&w=200&h=200&c=7" },
                 { id: 1005, name: "Double Ka Meetha", price: 120, type: "veg", description: "Bread pudding dessert", image: "https://tse2.mm.bing.net/th?q=Double+Ka+Meetha&w=200&h=200&c=7" }
            ]
        },
        {
            id: 11,
            name: "Chaap Corner",
            rating: 4.2,
            deliveryTime: "25-35 mins",
            cuisine: "North Indian, Snacks",
            location: "CRPF Square",
            image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=800&auto=format&fit=crop",
            menu: [
                 { id: 1101, name: "Malai Chaap", price: 180, type: "veg", description: "Soya chaap tossed in creamy white gravy", image: "https://tse2.mm.bing.net/th?q=Malai+Chaap&w=200&h=200&c=7" },
                 { id: 1102, name: "Tandoori Chaap", price: 160, type: "veg", description: "Spicy roasted soya chaap", image: "https://tse2.mm.bing.net/th?q=Tandoori+Chaap&w=200&h=200&c=7" },
                 { id: 1103, name: "Rumali Roti", price: 20, type: "veg", description: "Thin soft bread", image: "https://tse2.mm.bing.net/th?q=Rumali+Roti&w=200&h=200&c=7" },
                 { id: 1104, name: "Paneer Tikka Roll", price: 150, type: "veg", description: "Spicy paneer wrapped in paratha", image: "https://tse2.mm.bing.net/th?q=Paneer+Tikka+Roll&w=200&h=200&c=7" },
                 { id: 1105, name: "Masala Chaap Gravy", price: 200, type: "veg", description: "Chaap cooked in spicy onion tomato gravy", image: "https://tse2.mm.bing.net/th?q=Masala+Chaap&w=200&h=200&c=7" }
            ]
        },
        {
            id: 12,
            name: "Puri Sabzi Wala",
            rating: 4.5,
            deliveryTime: "20-30 mins",
            cuisine: "Street Food, Breakfast",
            location: "Ghatikia",
            image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop",
            menu: [
                 { id: 1201, name: "Aloo Puri", price: 80, type: "veg", description: "Spicy potato curry with fried bread", image: "https://tse2.mm.bing.net/th?q=Aloo+Puri&w=200&h=200&c=7" },
                 { id: 1202, name: "Chole Bhature", price: 120, type: "veg", description: "Spicy chickpeas with fluffy fried bread", image: "https://tse2.mm.bing.net/th?q=Chole+Bhature&w=200&h=200&c=7" },
                 { id: 1203, name: "Lassi", price: 60, type: "veg", description: "Sweet yogurt drink served in clay pot", image: "https://tse2.mm.bing.net/th?q=Lassi&w=200&h=200&c=7" },
                 { id: 1204, name: "Halwa Puri", price: 100, type: "veg", description: "Sweet semolina pudding with puri", image: "https://tse2.mm.bing.net/th?q=Halwa+Puri&w=200&h=200&c=7" },
                 { id: 1205, name: "Kachori Sabzi", price: 50, type: "veg", description: "Crispy fried snack with aloo sabzi", image: "https://tse2.mm.bing.net/th?q=Kachori+Sabzi&w=200&h=200&c=7" }
            ]
        }
    ]
};
