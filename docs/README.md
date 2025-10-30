# Toast Module Documentation

> **Complete documentation for the Toast - Full Screen Celebrations module for Foundry VTT**

Welcome to the Toast documentation! This guide will help you get the most out of the module.

---

## 📚 Quick Links

### Getting Started
- **[Installation Guide](INSTALLATION.md)** - Install and set up the module
- **[Examples](EXAMPLES.md)** - 18+ ready-to-use macros

### Features
- **[AI Generation](AI-GENERATION.md)** - AI-powered announcements with Claude & OpenAI
- **[Template System](TEMPLATES.md)** - Reusable TTS templates
- **[Announcer Packs](ANNOUNCER-PACKS.md)** - Voice pack management

### Reference
- **[API Reference](API-REFERENCE.md)** - Complete API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Advanced
- **[Security Best Practices](SECURITY.md)** - API key safety
- **[Module Integration](MODULE-INTEGRATION.md)** - For module developers

---

## 📖 Documentation Structure

### For Players

**New to Toast?**
1. Start with [Installation Guide](INSTALLATION.md)
2. Try the [Basic Examples](EXAMPLES.md#basic-examples)
3. Explore [AI Generation](AI-GENERATION.md) for dynamic announcements

**Using AI Features?**
1. Read [Security Best Practices](SECURITY.md) first
2. Follow [AI Generation Setup](AI-GENERATION.md#setup)
3. Try the [AI Examples](EXAMPLES.md#ai-generation-examples)

**Having Issues?**
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [API Reference](API-REFERENCE.md) for correct usage

### For Game Masters

**Setting Up Your World:**
1. [Install the module](INSTALLATION.md)
2. Configure [permissions](INSTALLATION.md#permission-settings)
3. Set up [API keys](AI-GENERATION.md#setup) (optional)
4. Choose [announcer pack](ANNOUNCER-PACKS.md#using-announcer-packs)

**Creating Content:**
1. Browse [Examples](EXAMPLES.md) for inspiration
2. Create [custom templates](TEMPLATES.md#creating-custom-templates)
3. Build [custom announcer packs](ANNOUNCER-PACKS.md#creating-custom-announcer-packs)

### For Module Developers

**Integrating with Toast:**
1. Read [Module Integration Guide](MODULE-INTEGRATION.md)
2. Register your [announcer pack](MODULE-INTEGRATION.md#registering-your-announcer-pack)
3. Provide [sample macros](MODULE-INTEGRATION.md#providing-sample-macros)

---

## 📋 Guide Summaries

### [Installation Guide](INSTALLATION.md)
**Topics:**
- Installation methods (Manual, Foundry UI, CLI)
- System requirements
- Post-installation setup (permissions, API keys)
- Verification and testing
- Updating the module

**Read this if:** You're installing Toast for the first time

---

### [AI Generation](AI-GENERATION.md)
**Topics:**
- AI-powered text generation with Claude and OpenAI
- Setup guide for both providers
- Module settings configuration
- Complete API documentation
- 6 practical usage examples
- Prompt engineering tips
- System-agnostic design
- Cost estimates

**Read this if:** You want dynamic, context-aware announcements

---

### [Template System](TEMPLATES.md)
**Topics:**
- Reusable TTS templates
- ElevenLabs setup
- 10 built-in templates
- Creating custom templates
- Token validation
- 5 complete macro examples
- Cache management
- Best practices

**Read this if:** You want consistent announcements with token replacement

---

### [Announcer Packs](ANNOUNCER-PACKS.md)
**Topics:**
- What are announcer packs
- Using and switching packs
- Creating custom packs
- Multiple languages
- Themed announcers
- Combining with random sounds
- Recording and voice quality
- Sharing with community

**Read this if:** You want switchable voice narrators or multiple languages

---

### [API Reference](API-REFERENCE.md)
**Topics:**
- Complete API documentation
- All methods with parameters and return values
- Code examples for every method
- Security notes
- Quick reference guide

**Read this if:** You're writing macros or need technical details

---

### [Security Best Practices](SECURITY.md)
**Topics:**
- API key vulnerability explanation
- 6 core security practices
- API key management strategies
- Risk mitigation
- Security checklist
- What to do if compromised
- Future enhancements

**Read this if:** You're using AI features or concerned about API key safety

---

### [Module Integration](MODULE-INTEGRATION.md)
**Topics:**
- Registering announcer packs from your module
- API parameters and file organization
- 3 complete integration examples
- 10 best practices
- Sample macros to include
- Troubleshooting integration issues
- Publishing checklist

**Read this if:** You're a module developer integrating with Toast

---

### [Examples](EXAMPLES.md)
**Topics:**
- 18+ comprehensive macro examples
- Basic examples (simple toasts, sounds, animations)
- D&D 5e examples (boss kills, crits, heals, spells)
- Pathfinder 2e examples
- Custom system examples (homebrew, sci-fi)
- Advanced examples (rich context, conditional logic)
- Error handling patterns
- Prompt writing tips

**Read this if:** You want ready-to-use macros or inspiration

---

### [Troubleshooting](TROUBLESHOOTING.md)
**Topics:**
- Common issues with solutions
- Permission problems
- Sound and visual issues
- Animation problems
- AI generation errors
- TTS errors
- Template errors
- Cache issues
- Module conflicts
- Diagnostic commands
- Getting help

**Read this if:** Something isn't working correctly

---

## 🎯 Common Tasks

### "I want to show a simple toast with text"
→ See [Examples: Basic Examples](EXAMPLES.md#basic-examples)

### "I want AI-generated announcements"
→ See [AI Generation Guide](AI-GENERATION.md)

### "I want to create reusable templates"
→ See [Template System Guide](TEMPLATES.md)

### "I want to change the announcer voice"
→ See [Announcer Packs Guide](ANNOUNCER-PACKS.md)

### "I want to create my own voice pack"
→ See [Creating Custom Packs](ANNOUNCER-PACKS.md#creating-custom-announcer-packs)

### "My module wants to add announcer packs"
→ See [Module Integration Guide](MODULE-INTEGRATION.md)

### "Something isn't working"
→ See [Troubleshooting Guide](TROUBLESHOOTING.md)

### "I need API documentation"
→ See [API Reference](API-REFERENCE.md)

### "I'm worried about API key security"
→ See [Security Best Practices](SECURITY.md)

---

## 🔍 Search by Feature

### AI Features
- [AI Generation Setup](AI-GENERATION.md#setup)
- [AI Examples](EXAMPLES.md#dd-5e-examples)
- [API Key Security](SECURITY.md)
- [Cost Estimates](AI-GENERATION.md#cost-estimates)

### Audio Features
- [Text-to-Speech Templates](TEMPLATES.md)
- [Announcer Packs](ANNOUNCER-PACKS.md)
- [Random Sounds](API-REFERENCE.md#sound-utilities)
- [ElevenLabs Setup](TEMPLATES.md#elevenlabs-setup)

### Visual Features
- [Element Types](API-REFERENCE.md#core-methods)
- [Animations](EXAMPLES.md#basic-examples)
- [Multi-element Toasts](EXAMPLES.md#advanced-examples)

### System Integration
- [D&D 5e Examples](EXAMPLES.md#dd-5e-examples)
- [Pathfinder 2e Examples](EXAMPLES.md#pathfinder-2e-examples)
- [Custom Systems](EXAMPLES.md#custom-system-examples)
- [System-Agnostic Design](AI-GENERATION.md#system-agnostic-design)

---

## 📞 Support

### Before Asking for Help
1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [API Reference](API-REFERENCE.md)
3. Try the [diagnostic commands](TROUBLESHOOTING.md#diagnostic-commands)

### Getting Help
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/toast/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/yourusername/toast/discussions)
- **Documentation**: Search these guides

---

## 🔄 Staying Updated

### Version History
See [CHANGELOG.md](../CHANGELOG.md) for complete version history

### Current Version
**2.0.0** - AI-generated announcements with Claude and OpenAI

---

## 📝 Contributing to Documentation

Found an error or want to improve the docs?

1. Fork the repository
2. Edit the markdown files in `docs/`
3. Submit a pull request

---

**Ready to get started? → [Installation Guide](INSTALLATION.md)**
