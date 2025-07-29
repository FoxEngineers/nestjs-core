# Multi-Language Setup - AutoFillForm

## Overview
The authentication system now supports English (`en`) with the default language configurable via `APP_LOCALE` environment variable.

## Language Detection
The system detects language from:
1. **HTTP Headers**: `x-lang`
2. **Accept-Language header**: Standard browser language preference

## Environment Variables
Add to your `.env` and `.env.example` files:
```env
# Default application locale
APP_LOCALE=en
```

## Usage Examples

### Setting Language via Headers
```bash

# English
curl -H "lang: en" http://localhost:3000/api/auth/register

```

### API Response Examples

#### English Response
```json
{
  "error": "Passwords do not match"
}
```

## Translation Files
- **English**: `src/i18n/en/auth.json`

## Features Translated
- ✅ Registration validation messages
- ✅ Login error messages  
- ✅ Email verification messages
- ✅ Password reset messages
- ✅ Email templates (verification & password reset)
- ✅ Success/error responses

## Adding New Languages
1. Create new locale file: `src/i18n/{lang}/auth.json`
2. Copy structure from existing files
3. Translate all messages
4. Language will be auto-detected from headers

## Configuration

### I18n Module Setup
- ✅ **Default language**: Set by `APP_LOCALE` environment variable
- ✅ **Header resolvers**: `x-lang`,
- ✅ **Auto-reload**: Translation files watched for changes

## Email Templates
Email templates are automatically translated based on user's language preference:
- Verification emails
- Password reset emails
- All email content and buttons

The system maintains consistency across all user-facing messages in both languages. 