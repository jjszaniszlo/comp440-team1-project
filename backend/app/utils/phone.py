from typing import Optional

import phonenumbers
from phonenumbers import NumberParseException


def normalize_phone_number(
    phone: str, default_region: str = "US", strict: bool = False
) -> str:
    try:
        parsed_number = phonenumbers.parse(phone, default_region)

        if not phonenumbers.is_possible_number(parsed_number):
            raise ValueError(f"Invalid phone number format: {phone}")

        if strict and not phonenumbers.is_valid_number(parsed_number):
            raise ValueError(f"Phone number not assigned/valid: {phone}")

        country_code = parsed_number.country_code
        national_number = parsed_number.national_number

        return f"+{country_code}.{national_number}"

    except NumberParseException as e:
        raise ValueError(f"Failed to parse phone number '{phone}': {e}") from e


def validate_phone_number(phone: str, default_region: str = "US") -> bool:
    try:
        parsed_number = phonenumbers.parse(phone, default_region)
        return phonenumbers.is_valid_number(parsed_number)
    except NumberParseException:
        return False


def get_phone_region(phone: str, default_region: str = "US") -> Optional[str]:
    try:
        parsed_number = phonenumbers.parse(phone, default_region)
        return phonenumbers.region_code_for_number(parsed_number)
    except NumberParseException:
        return None
