from datetime import datetime

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