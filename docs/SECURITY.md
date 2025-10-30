# Security Guide

Critical security information for Toast module API key management and best practices.

## Table of Contents

- [Overview](#overview)
- [The Risk](#the-risk)
- [Understanding the Vulnerability](#understanding-the-vulnerability)
- [Best Practices](#best-practices)
- [API Key Management](#api-key-management)
- [Risk Mitigation Strategies](#risk-mitigation-strategies)
- [Security Checklist](#security-checklist)
- [Future Enhancements](#future-enhancements)
- [What to Do If Compromised](#what-to-do-if-compromised)

---

## Overview

**IMPORTANT:** Foundry VTT modules run in the same JavaScript context with no security isolation between modules. This creates potential security risks when storing API keys in module settings.

This guide explains:
- What the security risk is
- How to protect your API keys
- Best practices for safe usage
- What to do if keys are compromised

---

## The Risk

### The Core Problem

When you store API keys in Foundry module settings, those keys are accessible to **any other module** running in the same environment. This is not a bug - it's a fundamental limitation of how browser-based applications work.

### Who Is At Risk?

- **GMs storing API keys** in Toast settings
- **Players using their own API keys** for TTS or AI generation
- **Anyone using modules from untrusted sources**

### What Could Happen?

A malicious module could potentially:

1. **Steal API keys** stored in settings
2. **Use your keys** to make unauthorized API calls
3. **Exhaust your API limits** causing service disruption
4. **Incur unexpected costs** on your API account

---

## Understanding the Vulnerability

### How Module Settings Work

Foundry stores module settings in a way that any module can access them:

```javascript
// Any module could theoretically do this:
const stolenKey = game.settings.get("toast", "ai-claude-api-key-world");
const elevenLabsKey = game.settings.get("toast", "elevenlabs-api-key");
```

### Why This Is Possible

- **No JavaScript Isolation**: All modules run in the same browser context
- **Shared Global Scope**: `game` object is accessible to all modules
- **No Permission System**: JavaScript has no way to restrict module access
- **Browser Security Model**: Browsers don't provide module-level sandboxing

### What Toast Does to Help

Toast implements several protective measures:

1. **Client-Side Keys**: TTS keys are client-side by default (never shared)
2. **Permission Controls**: Granular controls for who can use AI keys
3. **Clear Warnings**: Prominent security warnings in settings UI
4. **Documentation**: Comprehensive security guidance (this document)

However, these measures **cannot prevent a malicious module from reading settings**.

---

## Best Practices

### 1. Only Install Modules from Trusted Sources

**Critical**: This is your first and best line of defense.

**Before Installing a Module:**

✅ **Check the source**
- Is it from a known developer?
- Does it have active maintenance?
- Is the code publicly available on GitHub?

✅ **Review community feedback**
- Read reviews and ratings
- Check Foundry VTT Discord/Reddit discussions
- Look for reports of suspicious behavior

✅ **Check recent activity**
- When was the last update?
- Are issues being addressed?
- Is the developer responsive?

❌ **Avoid:**
- Modules from unknown sources
- Modules with no documentation
- Modules requesting unusual permissions
- Modules with no community feedback

### 2. Use Separate API Keys for Foundry

**Never use your main account API keys in Foundry.**

**Create Dedicated Keys:**

1. Go to your API provider's key management page
2. Create a new key specifically for Foundry
3. Name it clearly (e.g., "Foundry-Toast-Key")
4. Use only this key in Foundry settings

**Benefits:**
- Easy to rotate if compromised
- Limits blast radius if stolen
- Easier to track usage
- Simpler to revoke without affecting other services

**How to Create:**

**Claude (Anthropic):**
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Click "Create Key"
3. Name: "Foundry-Toast"
4. Copy and save securely

**OpenAI:**
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name: "Foundry-Toast"
4. Copy and save securely (shown only once)

**ElevenLabs:**
1. Visit [ElevenLabs Profile](https://elevenlabs.io)
2. Go to Profile → API Keys
3. Generate new key
4. Name: "Foundry-Toast"

### 3. Set Spending Limits on API Keys

**Critical**: Always set spending limits to prevent runaway costs.

**Claude (Anthropic):**
1. Go to [Anthropic Console - Limits](https://console.anthropic.com/settings/limits)
2. Set **Monthly Budget** (e.g., $10/month)
3. Set **Usage Alerts** (e.g., notify at 50%, 80%, 100%)
4. Enable **Hard Limit** (stops usage at limit)

**OpenAI:**
1. Go to [OpenAI Account Limits](https://platform.openai.com/account/limits)
2. Set **Monthly Budget** (e.g., $10/month)
3. Set **Usage Alerts**
4. Configure **Hard Limit**

**ElevenLabs:**
1. Go to [ElevenLabs Subscription](https://elevenlabs.io)
2. Select appropriate tier
3. Usage automatically stops at tier limit

**Recommended Limits:**

For casual use:
- **Claude/OpenAI**: $5-10/month
- **ElevenLabs**: Free tier (10,000 chars) or $5/month

For heavy use:
- **Claude/OpenAI**: $20-50/month
- **ElevenLabs**: $11-22/month

### 4. Monitor API Usage Regularly

**Check your usage dashboards weekly:**

**Claude (Anthropic):**
- [Console Dashboard](https://console.anthropic.com/dashboard)
- Review usage by day/week/month
- Check for unexpected spikes

**OpenAI:**
- [Usage Dashboard](https://platform.openai.com/usage)
- Review costs by endpoint
- Check for unusual patterns

**ElevenLabs:**
- [Subscription Page](https://elevenlabs.io)
- Review character usage
- Check remaining quota

**What to Look For:**

🚨 **Suspicious Activity:**
- Usage spikes at odd hours
- Calls from unexpected locations
- Higher usage than your game sessions
- Unusual API endpoint patterns

✅ **Normal Activity:**
- Usage aligns with game sessions
- Predictable patterns
- Within expected ranges

### 5. Rotate Keys Periodically

**Change your API keys regularly as preventive maintenance.**

**Rotation Schedule:**

- **Every 3 months**: For normal usage
- **Every month**: For high-security environments
- **Immediately**: If you suspect compromise

**How to Rotate:**

1. **Create new key** in API provider dashboard
2. **Update Foundry settings** with new key
3. **Test functionality** to ensure it works
4. **Revoke old key** in API provider dashboard
5. **Document change** (optional, for your records)

### 6. Review Installed Modules

**Audit your module list regularly:**

**Monthly Review:**
1. Go to **Manage Modules**
2. Review each active module
3. Ask yourself:
   - Do I still use this?
   - Is it still maintained?
   - Are there any security concerns?
4. Disable unused modules
5. Uninstall modules you don't trust

**After Updates:**
- Review module changelog
- Check for new permissions or features
- Verify module still comes from trusted source

---

## API Key Management

### Storage Locations

Toast stores API keys in two locations:

**World Settings (GM Keys):**
- Location: World database
- Access: GM only initially
- Sharing: Controlled by GM settings
- Visibility: Accessible to all modules

**Client Settings (User Keys):**
- Location: Browser local storage
- Access: Individual user only
- Sharing: Never shared
- Visibility: Accessible to all modules in that browser

### Key Sharing Controls

GMs can control who uses their AI keys:

**None (GM Only)** - Recommended for security
- Only GM pays for AI generation
- Players cannot use GM's keys
- Most secure option

**All Players**
- Everyone can trigger AI generation
- GM pays for all usage
- Higher usage and cost
- Requires trust in all players

**By Role**
- Specific roles can use keys (e.g., Trusted Players)
- Moderate security
- Limits usage to certain users

**By Username**
- Specific usernames can use keys
- Good for small, trusted groups
- Easy to manage

### Recommended Configuration

**For Public Games / Untrusted Players:**
```
AI Key Sharing: None (GM Only)
Permission Mode: GM Only or By Role (Trusted Player+)
```

**For Private Games / Trusted Friends:**
```
AI Key Sharing: All Players or By Username
Permission Mode: By Role (Player+)
```

**For Solo GM Testing:**
```
AI Key Sharing: None
Permission Mode: GM Only
Use Own Keys: Disabled (use GM world keys)
```

---

## Risk Mitigation Strategies

### Layered Security Approach

Use multiple strategies together:

1. **Prevention**: Only install trusted modules
2. **Limitation**: Set spending limits on keys
3. **Detection**: Monitor usage regularly
4. **Response**: Rotate keys periodically
5. **Isolation**: Use separate keys for Foundry

### Compartmentalization

Separate your keys by purpose:

```
Personal Projects:    personal-main-key
Foundry (World 1):    foundry-world1-key
Foundry (World 2):    foundry-world2-key
Testing/Development:  foundry-test-key
```

Benefits:
- Compromise affects only one environment
- Easier to track which key is leaking
- Simpler to revoke and replace

### Principle of Least Privilege

**Only give access to who needs it:**

- Don't share AI keys unless necessary
- Use "GM Only" permission mode when possible
- Enable "Use Own AI Keys" for trusted players
- Review permissions when players join/leave

### Regular Security Audits

**Monthly Checklist:**

- [ ] Review installed modules
- [ ] Check API usage dashboards
- [ ] Verify spending limits are set
- [ ] Confirm no suspicious activity
- [ ] Test that keys still work
- [ ] Review who has permissions
- [ ] Check for module updates

---

## Security Checklist

### Initial Setup

- [ ] Create separate API keys for Foundry
- [ ] Set spending limits on all keys
- [ ] Configure usage alerts
- [ ] Only install modules from trusted sources
- [ ] Review module permissions before enabling
- [ ] Set appropriate Toast permission mode
- [ ] Configure AI key sharing settings

### Weekly Maintenance

- [ ] Check API usage dashboards
- [ ] Review unusual activity
- [ ] Verify spending is within limits

### Monthly Maintenance

- [ ] Audit installed modules
- [ ] Remove unused modules
- [ ] Review module updates
- [ ] Check security announcements
- [ ] Consider rotating keys (every 3 months)

### After Installing New Module

- [ ] Research module source
- [ ] Check community reviews
- [ ] Read module permissions
- [ ] Monitor API usage for changes
- [ ] Watch for suspicious behavior

---

## Future Enhancements

### Planned: Server-Side Proxy (v2.1.0+)

A future version may include an optional server-side proxy feature:

**How It Would Work:**
1. GM stores API keys on Foundry server (not in browser)
2. Client requests go through server proxy
3. Server makes API calls with stored keys
4. Keys never exposed to browser/modules

**Benefits:**
- Keys not accessible to malicious modules
- Better security for world-level keys
- Centralized key management
- Audit logging possible

**Status**: Planned for v2.1.0 or later

**Note**: This requires server-side setup and may not be suitable for all hosting environments.

---

## What to Do If Compromised

### If You Suspect Your Key Was Stolen

**Immediate Actions:**

1. **Revoke the key immediately**
   - Go to API provider dashboard
   - Delete/revoke the compromised key
   - Do not wait

2. **Check usage dashboard**
   - Look for unauthorized usage
   - Document any suspicious activity
   - Note timestamps and patterns

3. **Create new key**
   - Generate a new API key
   - Use a different name
   - Update Foundry settings

4. **Review modules**
   - Check recently installed modules
   - Disable suspicious modules
   - Report to module author or community

5. **Contact API provider**
   - Report unauthorized usage
   - Request usage review
   - May get usage credited back

### If You See Unexpected Charges

1. **Revoke all API keys** for that service
2. **Check usage logs** for unauthorized calls
3. **Contact API provider support** immediately
4. **Change account password** as precaution
5. **Enable 2FA** if available
6. **Request charge dispute** if appropriate

### If a Module Appears Malicious

1. **Disable the module** immediately
2. **Rotate all API keys** stored in Foundry
3. **Report to community**:
   - Foundry VTT Discord
   - Module author
   - Reddit r/FoundryVTT
4. **Document behavior** for report
5. **Uninstall the module**
6. **Warn other users**

### Prevention After Compromise

1. Audit all installed modules
2. Remove anything suspicious
3. Only reinstall trusted modules
4. Set stricter spending limits
5. Monitor usage more frequently
6. Consider using player "Use Own Keys" option

---

## Additional Resources

### API Provider Security Docs

- [Anthropic Security Best Practices](https://docs.anthropic.com/security)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)
- [ElevenLabs Security](https://elevenlabs.io/docs/security)

### Foundry VTT Security

- [Foundry VTT Security](https://foundryvtt.com/article/security/)
- [Module Development Best Practices](https://foundryvtt.com/article/module-development/)

### Community Resources

- [Foundry VTT Discord](https://discord.gg/foundryvtt)
- [r/FoundryVTT Security Discussions](https://reddit.com/r/FoundryVTT)

---

## Summary

**Key Takeaways:**

1. **Trust is essential**: Only install modules from trusted sources
2. **Isolate your keys**: Use separate API keys for Foundry
3. **Limit the damage**: Set spending limits on all keys
4. **Stay vigilant**: Monitor usage regularly
5. **Rotate regularly**: Change keys every few months
6. **React quickly**: If compromised, revoke immediately

**Remember**: No system is 100% secure, but following these practices significantly reduces your risk.

---

**Questions or Concerns?**

If you have security questions or want to report a vulnerability:

1. Check [GitHub Issues](https://github.com/yourusername/toast/issues)
2. Join [Foundry VTT Discord](https://discord.gg/foundryvtt)
3. Review other [Toast Documentation](../README.md)

---

**Stay safe and enjoy epic moments in your game!**
