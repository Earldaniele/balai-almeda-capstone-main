-- ============================================================================
-- CHILD POLICY IMPLEMENTATION - QUICK VERIFICATION QUERIES
-- Run these queries to verify the implementation is working correctly
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. SCHEMA VERIFICATION
-- Verify the child_ages column exists with correct data type
-- -----------------------------------------------------------------------------
DESCRIBE bookings;
-- Look for: child_ages | longtext | YES | | NULL | 

-- Alternative schema check
SHOW COLUMNS FROM bookings WHERE Field = 'child_ages';

-- -----------------------------------------------------------------------------
-- 2. SAMPLE DATA CHECK
-- View existing bookings with children (if any)
-- -----------------------------------------------------------------------------
SELECT 
    booking_id,
    reference_code,
    adults_count,
    children_count,
    child_ages,
    total_amount,
    status,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as booking_date
FROM bookings
WHERE children_count > 0
ORDER BY created_at DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- 3. JSON VALIDATION TEST
-- Test JSON parsing and extraction of child ages
-- -----------------------------------------------------------------------------
SELECT 
    reference_code,
    children_count,
    child_ages,
    JSON_VALID(child_ages) as is_valid_json,
    JSON_LENGTH(child_ages) as number_of_ages,
    JSON_EXTRACT(child_ages, '$[0]') as first_child_age,
    JSON_EXTRACT(child_ages, '$[1]') as second_child_age
FROM bookings
WHERE child_ages IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- -----------------------------------------------------------------------------
-- 4. PRICING VERIFICATION
-- Verify that total_amount includes child surcharges correctly
-- Calculate expected surcharge and compare with actual
-- -----------------------------------------------------------------------------
SELECT 
    b.reference_code,
    r.name as room_name,
    b.duration_hours,
    CASE b.duration_hours
        WHEN 3 THEN r.base_rate_3hr
        WHEN 6 THEN r.base_rate_6hr
        WHEN 12 THEN r.base_rate_12hr
        WHEN 24 THEN r.base_rate_24hr
    END as base_rate,
    b.children_count,
    b.child_ages,
    -- Actual total from database
    b.total_amount,
    -- Calculate expected surcharge (₱150 per child aged 7-13)
    -- This requires manual verification for now
    (b.total_amount - CASE b.duration_hours
        WHEN 3 THEN r.base_rate_3hr
        WHEN 6 THEN r.base_rate_6hr
        WHEN 12 THEN r.base_rate_12hr
        WHEN 24 THEN r.base_rate_24hr
    END) as calculated_surcharge
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
WHERE b.children_count > 0
ORDER BY b.created_at DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- 5. CHILD AGE DISTRIBUTION ANALYSIS
-- Understand age distribution in bookings (useful for reporting)
-- -----------------------------------------------------------------------------
-- This query extracts all child ages from JSON arrays
-- Note: Requires MySQL 8.0+ for JSON_TABLE function
SELECT 
    child_age,
    COUNT(*) as frequency,
    CASE 
        WHEN child_age BETWEEN 0 AND 6 THEN 'Free (0-6 years)'
        WHEN child_age BETWEEN 7 AND 13 THEN 'Chargeable (7-13 years)'
        ELSE 'Invalid Age'
    END as age_category
FROM (
    SELECT JSON_UNQUOTE(JSON_EXTRACT(child_ages, CONCAT('$[', idx, ']'))) as child_age
    FROM bookings
    CROSS JOIN (
        SELECT 0 as idx UNION ALL SELECT 1
    ) as indexes
    WHERE child_ages IS NOT NULL
      AND JSON_EXTRACT(child_ages, CONCAT('$[', idx, ']')) IS NOT NULL
) as ages
GROUP BY child_age, age_category
ORDER BY child_age;

-- -----------------------------------------------------------------------------
-- 6. QUICK TEST: Insert Sample Booking with Children
-- Use this to test if child_ages column accepts data correctly
-- Run only if you want to create a test record
-- -----------------------------------------------------------------------------
-- UNCOMMENT TO RUN TEST INSERT:
/*
INSERT INTO bookings (
    guest_id,
    room_id,
    reference_code,
    check_in_time,
    check_out_time,
    duration_hours,
    adults_count,
    children_count,
    child_ages,
    source,
    status,
    total_amount
) VALUES (
    1,                                  -- guest_id (use a valid guest ID)
    1,                                  -- room_id (use a valid room ID)
    'TEST-CHILD-001',                   -- reference_code
    '2024-06-01 14:00:00',             -- check_in_time
    '2024-06-01 17:00:00',             -- check_out_time
    3,                                  -- duration_hours
    2,                                  -- adults_count
    2,                                  -- children_count
    '[6, 10]',                         -- child_ages (JSON array)
    'Web',                              -- source
    'Confirmed',                        -- status
    650.00                              -- total_amount (₱500 base + ₱150 for 10-yr-old)
);

-- Verify the test insert
SELECT * FROM bookings WHERE reference_code = 'TEST-CHILD-001';

-- Clean up test data (run after verification)
-- DELETE FROM bookings WHERE reference_code = 'TEST-CHILD-001';
*/

-- -----------------------------------------------------------------------------
-- 7. AUDIT REPORT: All Bookings with Children
-- Comprehensive report for management review
-- -----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(b.created_at, '%Y-%m-%d') as booking_date,
    b.reference_code,
    r.name as room_type,
    b.adults_count,
    b.children_count,
    b.child_ages,
    -- Count how many children are chargeable (ages 7-13)
    -- Manual verification recommended
    CASE 
        WHEN b.child_ages IS NULL THEN 0
        WHEN JSON_CONTAINS(b.child_ages, '7') 
          OR JSON_CONTAINS(b.child_ages, '8')
          OR JSON_CONTAINS(b.child_ages, '9')
          OR JSON_CONTAINS(b.child_ages, '10')
          OR JSON_CONTAINS(b.child_ages, '11')
          OR JSON_CONTAINS(b.child_ages, '12')
          OR JSON_CONTAINS(b.child_ages, '13') THEN 'Has Chargeable Child'
        ELSE 'All Free'
    END as surcharge_status,
    CONCAT('₱', FORMAT(b.total_amount, 2)) as total_amount,
    b.status
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
WHERE b.children_count > 0
ORDER BY b.created_at DESC;

-- -----------------------------------------------------------------------------
-- 8. DATA INTEGRITY CHECK
-- Ensure children_count matches the number of ages in child_ages array
-- -----------------------------------------------------------------------------
SELECT 
    reference_code,
    children_count,
    child_ages,
    JSON_LENGTH(child_ages) as ages_provided,
    CASE 
        WHEN children_count = 0 AND child_ages IS NULL THEN 'OK'
        WHEN children_count > 0 AND JSON_LENGTH(child_ages) = children_count THEN 'OK'
        WHEN children_count > 0 AND child_ages IS NULL THEN 'ERROR: Missing ages'
        WHEN children_count != JSON_LENGTH(child_ages) THEN 'ERROR: Count mismatch'
        ELSE 'UNKNOWN'
    END as data_integrity_status
FROM bookings
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)  -- Last 30 days
ORDER BY created_at DESC;

-- -----------------------------------------------------------------------------
-- 9. REVENUE ANALYSIS: Child Surcharge Contribution
-- Calculate total revenue from child surcharges
-- -----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as bookings_with_children,
    SUM(children_count) as total_children,
    -- Approximate surcharge (actual calculation needs JSON parsing)
    -- This assumes average ₱100 per child (mix of free and ₱150)
    CONCAT('₱', FORMAT(SUM(children_count) * 100, 2)) as estimated_child_revenue
FROM bookings
WHERE children_count > 0
  AND status IN ('Confirmed', 'Checked_In', 'Completed')
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- -----------------------------------------------------------------------------
-- 10. LATEST BOOKING DETAILS
-- Get the most recent booking to verify current implementation
-- -----------------------------------------------------------------------------
SELECT 
    *
FROM bookings
ORDER BY created_at DESC
LIMIT 1;

-- -----------------------------------------------------------------------------
-- DONE! Run these queries to verify your child policy implementation
-- For issues, check:
-- 1. Server logs: Look for "👶 Child Policy Applied" messages
-- 2. Frontend: Inspect Network tab for payload sent to backend
-- 3. Database: Verify child_ages column has valid JSON arrays
-- -----------------------------------------------------------------------------
