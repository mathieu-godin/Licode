UPDATE users SET elo_rating = 1000 WHERE elo_rating IS NULL;
UPDATE users SET has_2400_rating_history = FALSE WHERE has_2400_rating_history IS NULL;
