from datetime import datetime, timedelta

import re

def validate_date(date_string, format_string="%Y-%m-%d"):
    try:
        
        return (True, datetime.strptime(date_string, format_string))
    except ValueError as e:
        print(f"Invalid date: {e}")
        return (False, None)
    
def parse_date_string(date_str):
    """
    Parse date string in English, Bangla, or mixed format and return formatted date.
    Always returns current or future dates (if date is in past, moves to next year).
    
    Args:
        date_str: Date string like 'Monday, January 15th', 'সোমবার, জানুয়ারি ১৪', 
                  or just 'Monday', 'সোমবার' (weekday only)
    
    Returns:
        Formatted date string like 'Mon, December 25, 2023'
    """
    isvalid, date = validate_date(date_str)
    if isvalid:
        return date.strftime('%a, %B %d, %Y')
    
    # Bangla to English mappings
    bangla_months = {
        'জানুয়ারি': 'January',
        'ফেব্রুয়ারি': 'February',
        'মার্চ': 'March',
        'এপ্রিল': 'April',
        'মে': 'May',
        'জুন': 'June',
        'জুলাই': 'July',
        'আগস্ট': 'August',
        'সেপ্টেম্বর': 'September',
        'অক্টোবর': 'October',
        'নভেম্বর': 'November',
        'ডিসেম্বর': 'December'
    }
    
    bangla_days = {
        'সোমবার': 'Monday',
        'মঙ্গলবার': 'Tuesday',
        'বুধবার': 'Wednesday',
        'বৃহস্পতিবার': 'Thursday',
        'শুক্রবার': 'Friday',
        'শনিবার': 'Saturday',
        'রবিবার': 'Sunday'
    }
    
    # Bangla numeral to English numeral
    bangla_digits = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    }
    
    # Convert Bangla numerals to English
    def convert_bangla_to_english_number(text):
        for bangla, english in bangla_digits.items():
            text = text.replace(bangla, english)
        return text
    
    # Normalize the input
    normalized = date_str
    
    # Replace Bangla months with English
    for bangla, english in bangla_months.items():
        normalized = normalized.replace(bangla, english)
    
    # Replace Bangla days with English
    for bangla, english in bangla_days.items():
        normalized = normalized.replace(bangla, english)
    
    # Convert Bangla numbers to English
    normalized = convert_bangla_to_english_number(normalized)
    
    # Remove ordinal suffixes (st, nd, rd, th)
    normalized = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', normalized)
    
    # Extract month, day, and year
    months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
    
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    month = None
    day = None
    year = None
    weekday_name = None
    
    # Find weekday
    for wd in weekdays:
        if wd in normalized:
            weekday_name = wd
            break
    
    # Find month
    for m in months:
        if m in normalized:
            month = m
            break
    
    # Find day (1-31)
    day_match = re.search(r'\b(\d{1,2})\b', normalized)
    if day_match:
        day = int(day_match.group(1))
    
    # Find year (4 digits)
    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', normalized)
    if year_match:
        year = int(year_match.group(1))
    else:
        year = datetime.now().year
    
    # Handle weekday-only input: find next occurrence of that weekday
    if weekday_name and not month and not day:
        today = datetime.now()
        target_weekday = weekdays.index(weekday_name)  # 0=Monday, 6=Sunday
        current_weekday = today.weekday()  # 0=Monday, 6=Sunday
        
        # Calculate days until target weekday
        days_ahead = target_weekday - current_weekday
        if days_ahead <= 0:  # Target day already happened this week or is today
            days_ahead += 7  # Go to next week
        
        target_date = today + timedelta(days=days_ahead)
        return target_date.strftime('%a, %B %d, %Y')
    
    # Create date object and format for full date strings
    if month and day:
        month_num = months.index(month) + 1
        date_obj = datetime(year, month_num, day)
        
        # Check if date is in the past
        today = datetime.now()
        if date_obj.date() < today.date():
            # Move to next year
            date_obj = datetime(year + 1, month_num, day)
        
        return date_obj.strftime('%a, %B %d, %Y')
    else:
        raise ValueError(f"Could not parse date from: {date_str}")



def is_date_in_schedule(date_str, schedule_str):
    """
    Check if a given date falls on a weekday specified in the schedule.
    
    Args:
        date_str (str): Date in format 'Day, Month DD, YYYY' (e.g., 'Mon, December 25, 2023')
        schedule_str (str): Schedule pattern (e.g., 'Mon-Fri 9AM-5PM' or 'Mon, Wed, Fri 8AM-4PM')
    
    Returns:
        bool: True if the date's weekday is in the schedule, False otherwise
    """
    
    # Parse the input date
    try:
        # Extract the weekday from the date string
        date_weekday = date_str.split(',')[0].strip()
        
        # Also parse the full date to get the actual weekday for verification
        date_part = date_str.split(',', 1)[1].strip()  # "December 25, 2023"
        parsed_date = datetime.strptime(date_part, "%B %d, %Y")
        actual_weekday = parsed_date.strftime("%a")  # Mon, Tue, Wed, etc.
        
    except (ValueError, IndexError) as e:
        print(f"Error parsing date: {e}")
        return False
    
    # Extract weekdays from schedule
    schedule_weekdays = set()
    
    # Handle range format like "Mon-Fri"
    if '-' in schedule_str and not ',' in schedule_str.split()[0]:
        range_part = schedule_str.split()[0]  # "Mon-Fri"
        start_day, end_day = range_part.split('-')
        
        # Define weekday order
        weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        try:
            start_idx = weekdays.index(start_day)
            end_idx = weekdays.index(end_day)
            
            # Handle the range (assuming it doesn't wrap around the week)
            if start_idx <= end_idx:
                for i in range(start_idx, end_idx + 1):
                    schedule_weekdays.add(weekdays[i])
            else:
                # Handle wrap-around case (e.g., Fri-Mon)
                for i in range(start_idx, len(weekdays)):
                    schedule_weekdays.add(weekdays[i])
                for i in range(0, end_idx + 1):
                    schedule_weekdays.add(weekdays[i])
                    
        except ValueError:
            print(f"Invalid weekday in range: {range_part}")
            return False
    
    # Handle comma-separated format like "Mon, Wed, Fri"
    else:
        # Extract the days part (before time)
        days_part = schedule_str.split()[0]  # Get first part before space
        if ',' in days_part:
            # Split by comma and clean up
            days = [day.strip() for day in days_part.split(',')]
            schedule_weekdays.update(days)
        else:
            # Single day
            schedule_weekdays.add(days_part)
    
    # Check if the date's weekday is in the schedule
    # Use the actual parsed weekday for accuracy
    return actual_weekday in schedule_weekdays