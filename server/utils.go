package main

import (
	"math/rand"
)

func GenerateRandomString(numAdj int) string {
	ret := ""
	n := len(adjectives)
	m := len(nouns)
	for i := 0; i < numAdj; i++ {
		ret += adjectives[rand.Intn(n)]
	}
	ret += nouns[rand.Intn(m)]
	return ret;
}

func GenerateUntilNew[T any](b *map[string]T) string {
	for {
		numAdj := 1
		for i := 0; i < 10; i++ {
			try := GenerateRandomString(numAdj)
			_, exists := (*b)[try]
			if !exists {
				return try
			}
		}
		numAdj++;
	}
}

var adjectives = []string{
	"Big", "Fuzzy",	"Sweet", "Purple", "Green", "Blue", "Strong", "Mighty", "Majestic",
	"Proud", "Determined", "Clever", "Small", "Tiny", "Cute", "Fluffy", "Soothing", "Elegant",
	"Funny", "Happy", "Thoughtful", "Wooden", "Shiny", "Graceful", "Timid", "Aggressive",
	"Teal", "Sapphire", "Ancient", "Lucid", "Healthy", "Misty", "Mysterious", "Red", "Ferocious",
	"Tasteful", "Wondrous", "Brilliant", "Keen", "Energetic", "Mystic", "Dedicated", "True",
	"Generous", "Windy", "Pearly", "Mindful", "Nimble", "Quiet", "Curious", "Humble", "Super",
	"Industrious", "Kind", "Dutiful", "Capable", "Pleasant", "Precious", "Fearless", "Nice", 
	"Agreeable", "Judicious", "Timely", "Diligent", "Persistent", "Harmonious", "Reasonable",
	"Rational", "Empathetic", "Cordial", "Tractable", "Great", "Charming", "Handsome", "Fatherly",
	"Daring", "Gifted",
}

var nouns = []string{
	"Sparrow", "Chickadee", "Python", "Jackal", "Axolotl", "Cat", "Goat", "Sloth", "Dinosaur",
	"Momo", "Peach", "Plum", "Bun", "Chickpea", "Nightingale", "Piper", "Pea", "Pearl", "Panther",
	"Songbird", "Ewe", "Hyena", "Meerkat", "Jinx", "Lynx", "Leopard", "Serval", "Mako", "Takoyaki",
	"Onigiri", "Oak", "Lavender", "Lotus", "Sunflower", "Egg", "Pastry", "Biscuit", "Lily", "Poodle",
	"Juniper", "Peanut", "Almond", "Cashew", "Pistachio", "Walnut", "Eggplant", "Gourd", "Karp", "Koi",
	"Salmon", "MustardLeaf", "Roe", "BonitoFlakes", "Peacock", "Mage", "Fawn", "Kelp", "Eel", "Onion",
	"Tomato", "Kangaroo", "Ostrich", "Alpaca", "Llama", "Meex", "Poppy", "Snack", "Platypus", "Elf",
	"Sage", "Monk", "Farmer", "Sower", "Leaf", "Petunia", "Gardener", "Artist", "Feather", "Guard",
	"Traveler", "Adventurer", "Pear", "Grape", "MustardSeed", "Frog", "Tadpole", "Painter", "Giraffe",
}