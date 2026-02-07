-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 06, 2026 at 01:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `balai_almeda_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `guest_id` int(11) DEFAULT NULL,
  `room_id` int(11) NOT NULL,
  `reference_code` varchar(21) DEFAULT NULL,
  `checkout_session_id` varchar(255) DEFAULT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `duration_hours` int(11) NOT NULL,
  `adults_count` int(11) NOT NULL DEFAULT 1,
  `children_count` int(11) NOT NULL DEFAULT 0,
  `child_ages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`child_ages`)),
  `source` enum('Web','Walk_in') DEFAULT 'Web',
  `status` enum('Pending_Payment','Confirmed','Checked_In','Completed','Cancelled') DEFAULT 'Pending_Payment',
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `guest_id`, `room_id`, `reference_code`, `checkout_session_id`, `check_in_time`, `check_out_time`, `duration_hours`, `adults_count`, `children_count`, `child_ages`, `source`, `status`, `total_amount`, `created_at`) VALUES
(38, 16, 22, 'BKG-ML6PD5O0-7AINJSJC', 'cs_8QKh2EfovrTBS7NBcsBHjNPc', '2026-02-04 06:00:00', '2026-02-04 09:00:00', 3, 1, 0, NULL, 'Web', 'Confirmed', 1195.00, '2026-02-03 14:37:20'),
(44, 16, 4, 'BKG-ML92Q3M4-HXURGHP4', 'cs_a57899a7c45aa748278fcd02', '2026-02-06 06:00:00', '2026-02-06 09:00:00', 3, 1, 0, NULL, 'Web', 'Cancelled', 550.00, '2026-02-05 06:26:51'),
(45, 16, 5, 'BKG-ML92QTSW-RDY16VWE', 'cs_2e238c5140acbb7f4153f435', '2026-02-06 06:00:00', '2026-02-06 09:00:00', 3, 1, 0, NULL, 'Web', 'Cancelled', 550.00, '2026-02-05 06:27:25'),
(46, 16, 4, 'BKG-ML932IFS-HDOGK0K0', 'cs_6bdcfbc24bff4993bcdbbcdf', '2026-02-06 06:00:00', '2026-02-06 09:00:00', 3, 1, 0, NULL, 'Web', 'Cancelled', 550.00, '2026-02-05 06:36:30'),
(66, 16, 1, 'BKG-ML9GPV1X-N3Y06FWF', 'cs_9f89e062a7557a104867c81c', '2026-02-08 06:00:00', '2026-02-08 09:00:00', 3, 1, 0, NULL, 'Web', 'Cancelled', 450.00, '2026-02-05 12:58:35'),
(67, 16, 22, 'BKG-ML9H2OVZ-DOQXZ6JF', 'cs_ed0d3697f622eb83f1b11a79', '2026-02-07 06:00:00', '2026-02-07 12:00:00', 6, 1, 0, NULL, 'Web', 'Confirmed', 1595.00, '2026-02-05 13:08:33'),
(68, 16, 20, 'BKG-ML9J6N1A-MKMDO0SM', 'cs_cc12b7b97ff365bd63b823bf', '2026-02-07 06:00:00', '2026-02-07 09:00:00', 3, 1, 0, NULL, 'Web', 'Confirmed', 650.00, '2026-02-05 14:07:37'),
(69, 16, 21, 'BKG-ML9J97SI-AAFYAZC7', 'cs_d2abf1c5e1dbf70532c41a4d', '2026-02-07 06:00:00', '2026-02-07 09:00:00', 3, 1, 0, NULL, 'Web', 'Cancelled', 650.00, '2026-02-05 14:09:37'),
(70, 16, 4, 'BKG-MLANNMQI-OVF28LPO', 'cs_165d9bf135f8ca26fecce88b', '2026-02-07 06:00:00', '2026-02-07 09:00:00', 3, 1, 0, NULL, 'Web', 'Confirmed', 550.00, '2026-02-06 09:00:34');

-- --------------------------------------------------------

--
-- Table structure for table `guests`
--

CREATE TABLE `guests` (
  `guest_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `provider` enum('In_House','Partner_JustDrink') DEFAULT 'In_House',
  `current_stock` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`item_id`, `name`, `category`, `price`, `provider`, `current_stock`) VALUES
(1, 'Tapsilog', 'All-Day Breakfast', 85.00, 'In_House', 50),
(2, 'Longsilog', 'All-Day Breakfast', 85.00, 'In_House', 50),
(3, 'Tosilog', 'All-Day Breakfast', 85.00, 'In_House', 50),
(4, 'Hotsilog', 'All-Day Breakfast', 85.00, 'In_House', 50),
(5, 'Hamsilog', 'All-Day Breakfast', 85.00, 'In_House', 50),
(6, 'Ham Sandwich', 'All-Day Breakfast', 85.00, 'In_House', 50),
(7, 'Egg Sandwich', 'All-Day Breakfast', 85.00, 'In_House', 50),
(8, 'Ham & Egg Sandwich', 'All-Day Breakfast', 95.00, 'In_House', 50),
(9, 'Family House Clubhouse', 'All-Day Breakfast', 120.00, 'In_House', 50),
(10, 'Beef Bulgogi', 'Rice Meals', 175.00, 'In_House', 50),
(11, 'Beef Tapa', 'Rice Meals', 175.00, 'In_House', 50),
(12, 'Chicken Tocino', 'Rice Meals', 165.00, 'In_House', 50),
(13, 'Hungarian', 'Rice Meals', 175.00, 'In_House', 50),
(14, 'Chicken Poppers', 'Rice Meals', 165.00, 'In_House', 50),
(15, 'Extra Rice', 'Rice Meals', 40.00, 'In_House', 50),
(16, 'Extra Egg', 'Rice Meals', 30.00, 'In_House', 50),
(17, 'Chicken Alfredo', 'Pasta', 175.00, 'In_House', 50),
(18, 'Tuna Pesto', 'Pasta', 165.00, 'In_House', 50),
(19, 'Meaty Red Sauce', 'Pasta', 215.00, 'In_House', 50),
(20, 'Chicken Balls', 'Snack', 70.00, 'In_House', 50),
(21, 'Squid Balls', 'Snack', 70.00, 'In_House', 50),
(22, 'Kikiam', 'Snack', 100.00, 'In_House', 50),
(23, 'Cheese Sticks', 'Snack', 105.00, 'In_House', 50),
(24, 'Hash Brown', 'Snack', 45.00, 'In_House', 50),
(25, 'Thick Cut Fries', 'Snack', 105.00, 'In_House', 50),
(26, 'Nachos', 'Snack', 135.00, 'In_House', 50),
(27, 'Cup noodles', 'Noodles, Chips, Sweets', 50.00, 'In_House', 50),
(28, 'Pringles', 'Noodles, Chips, Sweets', 55.00, 'In_House', 50),
(29, 'Chips', 'Noodles, Chips, Sweets', 55.00, 'In_House', 50),
(30, 'Piknik', 'Noodles, Chips, Sweets', 60.00, 'In_House', 50),
(31, 'Bottled Water', 'Drinks', 30.00, 'In_House', 50),
(32, 'Coffee', 'Drinks', 35.00, 'In_House', 50),
(33, 'Hot Chocolate', 'Drinks', 35.00, 'In_House', 50),
(34, 'Softdrinks (Coke)', 'Drinks', 50.00, 'In_House', 50),
(35, 'Softdrinks (Royal)', 'Drinks', 50.00, 'In_House', 50),
(36, 'Softdrinks (Sprite)', 'Drinks', 50.00, 'In_House', 50),
(37, 'Soju (Strawberry)', 'Drinks', 140.00, 'In_House', 50),
(38, 'Soju (Peach)', 'Drinks', 140.00, 'In_House', 50),
(39, 'San Mig Light', 'Drinks', 65.00, 'In_House', 50),
(40, 'Red Horse', 'Drinks', 75.00, 'In_House', 50),
(41, 'Plate set', 'Supplies', 25.00, 'In_House', 50),
(42, 'Toothpaste', 'Supplies', 25.00, 'In_House', 50),
(43, 'Toothbrush', 'Supplies', 35.00, 'In_House', 50),
(44, 'Shampoo', 'Supplies', 20.00, 'In_House', 50),
(45, 'Conditioner', 'Supplies', 20.00, 'In_House', 50),
(46, 'Soap', 'Supplies', 20.00, 'In_House', 50),
(47, 'Slippers', 'Supplies', 30.00, 'In_House', 50),
(48, '16oz Cold Brew', 'Cold Brew', 95.00, 'Partner_JustDrink', NULL),
(49, '16oz Milk Cold Brew', 'Cold Brew', 115.00, 'Partner_JustDrink', NULL),
(50, '16oz OJ Cold Brew', 'Cold Brew', 115.00, 'Partner_JustDrink', NULL),
(51, '16oz Vietnamese', 'Cold Brew', 115.00, 'Partner_JustDrink', NULL),
(52, '16oz Spanish', 'Cold Brew', 135.00, 'Partner_JustDrink', NULL),
(53, '16oz Mocha', 'Cold Brew', 135.00, 'Partner_JustDrink', NULL),
(54, '16oz Caramel', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(55, '16oz Hazelnut', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(56, '16oz Vanilla', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(57, '16oz White Mocha', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(58, '22oz Cold Brew', 'Cold Brew', 115.00, 'Partner_JustDrink', NULL),
(59, '22oz Milk Cold Brew', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(60, '22oz OJ Cold Brew', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(61, '22oz Vietnamese', 'Cold Brew', 145.00, 'Partner_JustDrink', NULL),
(62, '22oz Spanish', 'Cold Brew', 165.00, 'Partner_JustDrink', NULL),
(63, '22oz Mocha', 'Cold Brew', 165.00, 'Partner_JustDrink', NULL),
(64, '22oz Caramel', 'Cold Brew', 175.00, 'Partner_JustDrink', NULL),
(65, '22oz Hazelnut', 'Cold Brew', 175.00, 'Partner_JustDrink', NULL),
(66, '22oz Vanilla', 'Cold Brew', 175.00, 'Partner_JustDrink', NULL),
(67, '22oz White Mocha', 'Cold Brew', 175.00, 'Partner_JustDrink', NULL),
(68, '16oz Sweet Cream', 'Cold Brew Cream', 125.00, 'Partner_JustDrink', NULL),
(69, '16oz Salted Cream', 'Cold Brew Cream', 130.00, 'Partner_JustDrink', NULL),
(70, '22oz Sweet Cream', 'Cold Brew Cream', 155.00, 'Partner_JustDrink', NULL),
(71, '22oz Salted Cream', 'Cold Brew Cream', 160.00, 'Partner_JustDrink', NULL),
(72, '16oz Dirty Matcha', 'Matcha', 145.00, 'Partner_JustDrink', NULL),
(73, '16oz Matcha Latte', 'Matcha', 145.00, 'Partner_JustDrink', NULL),
(74, '22oz Dirty Matcha', 'Matcha', 175.00, 'Partner_JustDrink', NULL),
(75, '22oz Matcha Latte', 'Matcha', 175.00, 'Partner_JustDrink', NULL),
(76, '16oz Honey Citron', 'Refreshers', 120.00, 'Partner_JustDrink', NULL),
(77, '16oz Passionfruit', 'Refreshers', 120.00, 'Partner_JustDrink', NULL),
(78, '16oz Blueberry Tea', 'Refreshers', 115.00, 'Partner_JustDrink', NULL),
(79, '16oz Strawberry Tea', 'Refreshers', 115.00, 'Partner_JustDrink', NULL),
(80, '22oz Honey Citron', 'Refreshers', 145.00, 'Partner_JustDrink', NULL),
(81, '22oz Passionfruit', 'Refreshers', 145.00, 'Partner_JustDrink', NULL),
(82, '22oz Blueberry Tea', 'Refreshers', 135.00, 'Partner_JustDrink', NULL),
(83, '22oz Strawberry Tea', 'Refreshers', 135.00, 'Partner_JustDrink', NULL),
(84, '22oz Blueberry Cream', 'Frappe', 165.00, 'Partner_JustDrink', NULL),
(85, '22oz Strawberry Cream', 'Frappe', 165.00, 'Partner_JustDrink', NULL),
(86, '22oz Chocolate Chip', 'Frappe', 185.00, 'Partner_JustDrink', NULL),
(87, '22oz Java Chip', 'Frappe', 185.00, 'Partner_JustDrink', NULL),
(88, '22oz Caramel', 'Frappe', 195.00, 'Partner_JustDrink', NULL),
(89, '22oz Matcha', 'Frappe', 200.00, 'Partner_JustDrink', NULL),
(90, '16oz Brewed Coffee', 'Hot', 95.00, 'Partner_JustDrink', NULL),
(91, '16oz Latte', 'Hot', 115.00, 'Partner_JustDrink', NULL),
(92, '16oz Vietnamese', 'Hot', 115.00, 'Partner_JustDrink', NULL),
(93, '16oz Spanish', 'Hot', 135.00, 'Partner_JustDrink', NULL),
(94, '16oz Mocha', 'Hot', 135.00, 'Partner_JustDrink', NULL),
(95, '16oz Caramel', 'Hot', 145.00, 'Partner_JustDrink', NULL),
(96, '16oz Hazelnut', 'Hot', 145.00, 'Partner_JustDrink', NULL),
(97, '16oz Vanilla', 'Hot', 145.00, 'Partner_JustDrink', NULL),
(98, '16oz Ube', 'Non-Coffee', 125.00, 'Partner_JustDrink', NULL),
(99, '16oz Matcha', 'Non-Coffee', 145.00, 'Partner_JustDrink', NULL),
(100, '16oz Signature Chocolate', 'Non-Coffee', 135.00, 'Partner_JustDrink', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `detail_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `method` enum('GCash','PayMongo','Cash','Card') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_ref` varchar(50) DEFAULT NULL,
  `status` enum('Success','Failed','Refunded') DEFAULT 'Success',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `slug` varchar(100) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `capacity` varchar(50) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `image` varchar(255) DEFAULT NULL,
  `type` enum('Value','Standard','Deluxe','Superior','Suite') NOT NULL,
  `base_rate_3hr` decimal(10,2) NOT NULL,
  `base_rate_6hr` decimal(10,2) NOT NULL,
  `base_rate_12hr` decimal(10,2) NOT NULL,
  `base_rate_24hr` decimal(10,2) NOT NULL,
  `status` enum('Available','Occupied','Dirty','Maintenance') DEFAULT 'Available',
  `lock_expiration` datetime DEFAULT NULL,
  `locked_by_session_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `room_number`, `name`, `slug`, `tagline`, `description`, `capacity`, `size`, `amenities`, `image`, `type`, `base_rate_3hr`, `base_rate_6hr`, `base_rate_12hr`, `base_rate_24hr`, `status`, `lock_expiration`, `locked_by_session_id`) VALUES
(1, '303V', 'Value Room 303', 'value-room-303', 'Compact and efficient.', 'Our most affordable option. Perfect for quick wash-ups.', '2 Adults', '18m²', '[\"High-Speed Wifi\", \"Air Conditioning\", \"Hot & Cold Shower\", \"Basic Toiletries\"]', 'bg-gray-200', 'Value', 450.00, 750.00, 1150.00, 1800.00, 'Available', NULL, NULL),
(2, '403V', 'Value Room 403', 'value-room-403', 'Compact and efficient.', 'Our most affordable option. Perfect for quick wash-ups.', '2 Adults', '18m²', '[\"High-Speed Wifi\", \"Air Conditioning\", \"Hot & Cold Shower\", \"Basic Toiletries\"]', 'bg-gray-200', 'Value', 450.00, 750.00, 1150.00, 1800.00, 'Available', NULL, NULL),
(3, '503V', 'Value Room 503', 'value-room-503', 'Compact and efficient.', 'Our most affordable option. Perfect for quick wash-ups.', '2 Adults', '18m²', '[\"High-Speed Wifi\", \"Air Conditioning\", \"Hot & Cold Shower\", \"Basic Toiletries\"]', 'bg-gray-200', 'Value', 450.00, 750.00, 1150.00, 1800.00, 'Available', NULL, NULL),
(4, '201S', 'Standard Room 201', 'standard-room-201', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(5, '202S', 'Standard Room 202', 'standard-room-202', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(6, '203S', 'Standard Room 203', 'standard-room-203', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(7, '204S', 'Standard Room 204', 'standard-room-204', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(8, '301S', 'Standard Room 301', 'standard-room-301', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(9, '302S', 'Standard Room 302', 'standard-room-302', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(10, '304S', 'Standard Room 304', 'standard-room-304', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(11, '305S', 'Standard Room 305', 'standard-room-305', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(12, '306S', 'Standard Room 306', 'standard-room-306', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(13, '401S', 'Standard Room 401', 'standard-room-401', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(14, '402S', 'Standard Room 402', 'standard-room-402', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(15, '404R', 'Standard Room 404', 'standard-room-404', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(16, '405S', 'Standard Room 405', 'standard-room-405', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(17, '501S', 'Standard Room 501', 'standard-room-501', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(18, '502S', 'Standard Room 502', 'standard-room-502', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(19, '504S', 'Standard Room 504', 'standard-room-504', 'The modern essential.', 'A cozy sanctuary with high-thread-count linens.', '2 Adults', '25m²', '[\"High-Speed Wifi\", \"Smart TV\", \"Air Conditioning\", \"Work Desk\", \"Hot & Cold Shower\", \"Premium Toiletries\"]', 'bg-gray-300', 'Standard', 550.00, 850.00, 1250.00, 1900.00, 'Available', NULL, NULL),
(20, '307D', 'Deluxe Room 307', 'deluxe-room-307', 'Room to breathe.', 'Upgrade your downtime. More floor space and a panoramic window.', '2 Adults', '35m²', '[\"High-Speed Wifi\", \"50\\\" Smart TV\", \"Air Conditioning\", \"Dedicated Workspace\", \"Mini Fridge\", \"Hot & Cold Shower\", \"Premium Toiletries\", \"Sofa Seating\"]', 'bg-gray-400', 'Deluxe', 650.00, 950.00, 1350.00, 2100.00, 'Available', NULL, NULL),
(21, '406D', 'Deluxe Room 406', 'deluxe-room-406', 'Room to breathe.', 'Upgrade your downtime. More floor space and a panoramic window.', '2 Adults', '35m²', '[\"High-Speed Wifi\", \"50\\\" Smart TV\", \"Air Conditioning\", \"Dedicated Workspace\", \"Mini Fridge\", \"Hot & Cold Shower\", \"Premium Toiletries\", \"Sofa Seating\"]', 'bg-gray-400', 'Deluxe', 650.00, 950.00, 1350.00, 2100.00, 'Available', NULL, NULL),
(22, 'SU01', 'Superior Room', 'superior-room-01', 'The premium choice.', 'Our most spacious accommodation. Designed for families or groups who need the ultimate comfort and privacy.', '3 Guests', '45m²', '[\"High-Speed Wifi\", \"55\\\" 4K TV\", \"Split-Type Aircon\", \"Living Area\", \"Dining Table\", \"Mini Fridge & Coffee Maker\", \"Hot & Cold Shower\", \"Luxury Toiletries\"]', 'bg-gray-500', 'Superior', 1195.00, 1595.00, 2495.00, 3495.00, 'Available', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `room_images`
--

CREATE TABLE `room_images` (
  `image_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_images`
--

INSERT INTO `room_images` (`image_id`, `room_id`, `image_path`, `is_primary`, `created_at`) VALUES
(1, 1, '/images/rooms/BA1.png', 1, '2026-02-03 17:03:58'),
(2, 2, '/images/rooms/BA1.png', 1, '2026-02-03 17:03:58'),
(3, 3, '/images/rooms/BA1.png', 1, '2026-02-03 17:03:58'),
(4, 4, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(5, 5, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(6, 6, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(7, 7, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(8, 8, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(9, 9, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(10, 10, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(11, 11, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(12, 12, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(13, 13, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(14, 14, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(15, 15, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(16, 16, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(17, 17, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(18, 18, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(19, 19, '/images/rooms/BA2.png', 1, '2026-02-03 17:03:58'),
(35, 20, '/images/rooms/BA3.png', 1, '2026-02-03 17:03:58'),
(36, 21, '/images/rooms/BA3.png', 1, '2026-02-03 17:03:58'),
(38, 22, '/images/rooms/BA4.png', 1, '2026-02-03 17:03:58');

-- --------------------------------------------------------

--
-- Table structure for table `room_orders`
--

CREATE TABLE `room_orders` (
  `order_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL,
  `status` enum('Pending','Delivered','Cancelled') DEFAULT 'Pending',
  `order_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift_reports`
--

CREATE TABLE `shift_reports` (
  `shift_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `shift_start` datetime NOT NULL,
  `shift_end` datetime DEFAULT NULL,
  `initial_cash` decimal(10,2) DEFAULT 0.00,
  `system_computed_cash` decimal(10,2) DEFAULT NULL,
  `physical_cash_count` decimal(10,2) DEFAULT NULL,
  `variance` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `position` varchar(50) NOT NULL,
  `hourly_rate` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Guest','Admin','FrontDesk','Housekeeping','Manager') DEFAULT 'Guest',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `phone`, `password`, `role`, `created_at`, `updated_at`) VALUES
(15, 'Drake', 'Sekito', 'drakesekito@gmail.com', '09204663525', '$2b$10$ljv9ChCRL9PYtxd2dgbqteqdQ.czeCcaFPGjablwibL9364ZLtumK', 'Guest', '2026-02-03 11:47:57', '2026-02-03 11:47:57'),
(16, 'Fritz Cholo', 'Fabila', 'fabila@gmail.com', '09204827643', '$2b$10$T1a4.qa//J.w8mdqAhV5hOmvNG8uIm2gexg9OuKKpVE79UN4h4sze', 'Guest', '2026-02-03 14:20:34', '2026-02-03 14:20:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD UNIQUE KEY `reference_code` (`reference_code`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `bookings_ibfk_1` (`guest_id`);

--
-- Indexes for table `guests`
--
ALTER TABLE `guests`
  ADD PRIMARY KEY (`guest_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_number` (`room_number`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_room_slug` (`slug`);

--
-- Indexes for table `room_images`
--
ALTER TABLE `room_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `room_orders`
--
ALTER TABLE `room_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `shift_reports`
--
ALTER TABLE `shift_reports`
  ADD PRIMARY KEY (`shift_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `guests`
--
ALTER TABLE `guests`
  MODIFY `guest_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `room_images`
--
ALTER TABLE `room_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `room_orders`
--
ALTER TABLE `room_orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shift_reports`
--
ALTER TABLE `shift_reports`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`guest_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Constraints for table `guests`
--
ALTER TABLE `guests`
  ADD CONSTRAINT `guests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `room_orders` (`order_id`),
  ADD CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Constraints for table `room_images`
--
ALTER TABLE `room_images`
  ADD CONSTRAINT `room_images_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE;

--
-- Constraints for table `room_orders`
--
ALTER TABLE `room_orders`
  ADD CONSTRAINT `room_orders_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Constraints for table `shift_reports`
--
ALTER TABLE `shift_reports`
  ADD CONSTRAINT `shift_reports_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`);

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
