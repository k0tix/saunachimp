CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  asset_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Owned products table
CREATE TABLE IF NOT EXISTS owned_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  in_use TINYINT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
);




-- Insert sample data
INSERT INTO products (name, description, price, item_type) VALUES
  ('Kiuas', 'Harvia Kiuas', 1299.99, 'kiuas', '/assets/kiuas.jpg'),
  ('Kupari lauteet', 'Perfect heat transfer for your sauna', 2209.99, 'lauteet', '/assets/lauteet.jpg'),
  ('Olut', 'gloms', 2209.99, 'generic', '/assets/olut.jpg'),
  ('saunakauha', 'saunakauha', 10.99, 'saunakauha', '/assets/saunakauha.jpg'),
  ('saunakiulu', 'saunakiulu', 10.99, 'kiulu', '/assets/kiulu.jpg');


-- Sensor logs table
CREATE TABLE IF NOT EXISTS sensor_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  shadow_name VARCHAR(50),
  sub_id VARCHAR(50),
  type VARCHAR(50),
  organization VARCHAR(100),
  session_id VARCHAR(255),
  heap_size INT,
  rssi INT,
  temp_esp DECIMAL(5, 2),
  target_temp DECIMAL(5, 2),
  presence TINYINT,
  temp DECIMAL(5, 2),
  sauna_status TINYINT,
  battery_load_v DECIMAL(6, 3),
  reset_cnt INT,
  hum DECIMAL(5, 2),
  battery_voltage DECIMAL(6, 3),
  time_to_target INT,
  sensor_timestamp VARCHAR(50),
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_logged_at (logged_at),
  INDEX idx_sauna_status (sauna_status)
);

