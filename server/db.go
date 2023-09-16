package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// GardeniaDB points to the database holding users and their settings.
var GardeniaDB *sql.DB

// ConnectToDB opens a connection to the database and makes `GardeniaDB` point to it.
func ConnectToDB() error {
	db_host := os.Getenv("DB_HOST")
	db_port := os.Getenv("DB_PORT")
	db_user := os.Getenv("DB_USER")
	db_name := os.Getenv("DB_NAME")
	db_password := os.Getenv("DB_PASSWORD")
	connectionStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s",
		db_host, db_port, db_user, db_password, db_name)
	db, err := sql.Open("postgres", connectionStr)
	if err != nil {
		return err
	}

	err = db.Ping()
	if err != nil {
		return err
	}
	fmt.Println("Connected to DB")
	GardeniaDB = db
	return nil
}

// InitializeDB Creates tables `users` and `settings` in `GardeniaDB` if they
// don't already exist.
func InitializeDB() error {
	_, err := GardeniaDB.Exec(`CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY NOT NULL,
		name VARCHAR(40) NOT NULL
	);
	CREATE TABLE IF NOT EXISTS settings (
		userId UUID REFERENCES users(id) NOT NULL,
		musicOn BOOLEAN NOT NULL,
		sfxOn BOOLEAN NOT NULL
	);
	`)
	if err != nil {
		return err
	}
	return nil
}

type UserData struct {
	name    string
	musicOn bool
	sfxOn   bool
}

// Inserts a new user into the database with default settings.
// Returns the user's UUID.
func CreateNewUser() (string, error) {
	name := GenerateUntilNew(&AllUsers)
	var generatedUUID string
	err := GardeniaDB.QueryRow(fmt.Sprintf(`INSERT INTO users (id, name) VALUES (gen_random_uuid(), '%s')
		RETURNING id;`, name)).Scan(&generatedUUID)
	if err != nil {
		return generatedUUID, err
	}
	_, err = GardeniaDB.Exec(fmt.Sprintf(`INSERT INTO settings (userId, musicOn, sfxOn)
		VALUES ('%s', %t, %t)`, generatedUUID, true, true))
	return generatedUUID, err
}

// GetUserSettings retrieves the game settings of the user with id `id`.
// Returns an error if the user is not found.
func GetUserSettings(id string) (*UserData, error) {
	ret := UserData{}
	row := GardeniaDB.QueryRow(fmt.Sprintf("SELECT name FROM users WHERE id='%s'", id))
	var name string
	err := row.Scan(&name)
	if err != nil {
		return nil, err
	}
	ret.name = name
	row = GardeniaDB.QueryRow(fmt.Sprintf("SELECT musicOn, sfxOn FROM settings WHERE userId='%s'", id))
	var musicOn, sfxOn bool
	err = row.Scan(&musicOn, &sfxOn)
	if err != nil {
		return nil, err
	}
	ret.musicOn = musicOn
	ret.sfxOn = sfxOn
	return &ret, nil
}

// UpdateBooleanSetting updates the settings table in the database by
// finding the user with the given id and changing the given setting to
// the given value.
func UpdateBooleanSetting(id, setting string, value bool) error {
	_, err := GardeniaDB.Exec(fmt.Sprintf(`UPDATE settings SET %s=%t WHERE userId='%s'`, setting, value, id))
	return err
}
