from datetime import datetime, timedelta
import re
from typing import Optional, Union

class DateParser:
    """A utility class for parsing natural language date expressions."""
    
    def __init__(self):
        self.today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
    def parse(self, date_string: str) -> Optional[datetime]:
        """
        Parse natural language date string and return datetime object.
        
        Args:
            date_string: Natural language date expression
            
        Returns:
            datetime object or None if parsing fails
        """
        date_string = date_string.lower().strip()
        
        # Handle relative days
        if date_string in ['today']:
            return self.today
        elif date_string in ['tomorrow']:
            return self.today + timedelta(days=1)
        elif date_string in ['yesterday']:
            return self.today - timedelta(days=1)
        
        # Handle day of week references
        if 'next' in date_string and any(day in date_string for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
            return self._parse_next_weekday(date_string)
        
        if 'last' in date_string and any(day in date_string for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
            return self._parse_last_weekday(date_string)
        
        # Handle week references
        if 'next week' in date_string:
            return self._parse_next_week(date_string)
        elif 'last week' in date_string:
            return self._parse_last_week(date_string)
        elif 'this week' in date_string:
            return self._parse_this_week(date_string)
        
        # Handle month references
        if 'next month' in date_string:
            return self._parse_next_month(date_string)
        elif 'last month' in date_string:
            return self._parse_last_month(date_string)
        
        # Handle relative day offsets
        days_match = re.search(r'(\d+)\s*days?\s*(ago|from now|later)', date_string)
        if days_match:
            days = int(days_match.group(1))
            direction = days_match.group(2)
            if direction == 'ago':
                return self.today - timedelta(days=days)
            else:
                return self.today + timedelta(days=days)
        
        # Handle weeks offset
        weeks_match = re.search(r'(\d+)\s*weeks?\s*(ago|from now|later)', date_string)
        if weeks_match:
            weeks = int(weeks_match.group(1))
            direction = weeks_match.group(2)
            if direction == 'ago':
                return self.today - timedelta(weeks=weeks)
            else:
                return self.today + timedelta(weeks=weeks)
        
        return None
    
    def _get_weekday_number(self, day_name: str) -> int:
        """Convert day name to weekday number (0=Monday, 6=Sunday)."""
        days = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6
        }
        return days.get(day_name.lower())
    
    def _parse_next_weekday(self, date_string: str) -> datetime:
        """Parse 'next [weekday]' expressions."""
        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            if day in date_string:
                target_weekday = self._get_weekday_number(day)
                current_weekday = self.today.weekday()
                days_ahead = (target_weekday - current_weekday) % 7
                if days_ahead == 0:  # If it's the same day, go to next week
                    days_ahead = 7
                return self.today + timedelta(days=days_ahead)
        return None
    
    def _parse_last_weekday(self, date_string: str) -> datetime:
        """Parse 'last [weekday]' expressions."""
        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            if day in date_string:
                target_weekday = self._get_weekday_number(day)
                current_weekday = self.today.weekday()
                days_back = (current_weekday - target_weekday) % 7
                if days_back == 0:  # If it's the same day, go to last week
                    days_back = 7
                return self.today - timedelta(days=days_back)
        return None
    
    def _parse_next_week(self, date_string: str) -> datetime:
        """Parse 'next week' expressions."""
        # Start of next week (Monday)
        days_until_monday = (7 - self.today.weekday()) % 7
        if days_until_monday == 0:  # If today is Monday
            days_until_monday = 7
        next_monday = self.today + timedelta(days=days_until_monday)
        
        if 'first day' in date_string or 'beginning' in date_string:
            return next_monday
        elif 'last day' in date_string or 'end' in date_string:
            return next_monday + timedelta(days=6)  # Sunday
        elif 'middle' in date_string or 'mid' in date_string:
            return next_monday + timedelta(days=3)  # Thursday
        else:
            return next_monday  # Default to first day
    
    def _parse_last_week(self, date_string: str) -> datetime:
        """Parse 'last week' expressions."""
        # Start of last week (Monday)
        days_since_monday = self.today.weekday()
        last_monday = self.today - timedelta(days=days_since_monday + 7)
        
        if 'first day' in date_string or 'beginning' in date_string:
            return last_monday
        elif 'last day' in date_string or 'end' in date_string:
            return last_monday + timedelta(days=6)  # Sunday
        elif 'middle' in date_string or 'mid' in date_string:
            return last_monday + timedelta(days=3)  # Thursday
        else:
            return last_monday  # Default to first day
    
    def _parse_this_week(self, date_string: str) -> datetime:
        """Parse 'this week' expressions."""
        # Start of this week (Monday)
        days_since_monday = self.today.weekday()
        this_monday = self.today - timedelta(days=days_since_monday)
        
        if 'first day' in date_string or 'beginning' in date_string:
            return this_monday
        elif 'last day' in date_string or 'end' in date_string:
            return this_monday + timedelta(days=6)  # Sunday
        elif 'middle' in date_string or 'mid' in date_string:
            return this_monday + timedelta(days=3)  # Thursday
        else:
            return this_monday  # Default to first day
    
    def _parse_next_month(self, date_string: str) -> datetime:
        """Parse 'next month' expressions."""
        if self.today.month == 12:
            next_month = self.today.replace(year=self.today.year + 1, month=1, day=1)
        else:
            next_month = self.today.replace(month=self.today.month + 1, day=1)
        
        if 'first day' in date_string or 'beginning' in date_string:
            return next_month
        elif 'last day' in date_string or 'end' in date_string:
            # Get last day of next month
            if next_month.month == 12:
                last_day = next_month.replace(year=next_month.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = next_month.replace(month=next_month.month + 1, day=1) - timedelta(days=1)
            return last_day
        else:
            return next_month  # Default to first day
    
    def _parse_last_month(self, date_string: str) -> datetime:
        """Parse 'last month' expressions."""
        if self.today.month == 1:
            last_month = self.today.replace(year=self.today.year - 1, month=12, day=1)
        else:
            last_month = self.today.replace(month=self.today.month - 1, day=1)
        
        if 'first day' in date_string or 'beginning' in date_string:
            return last_month
        elif 'last day' in date_string or 'end' in date_string:
            # Get last day of last month
            return self.today.replace(day=1) - timedelta(days=1)
        else:
            return last_month  # Default to first day
    
    def format_result(self, date: datetime, include_weekday: bool = True) -> str:
        """Format datetime object to readable string."""
        if include_weekday:
            return date.strftime("%A, %B %d, %Y")
        else:
            return date.strftime("%B %d, %Y")