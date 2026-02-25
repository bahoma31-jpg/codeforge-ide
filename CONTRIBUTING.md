# 🤝 Contributing to CodeForge IDE

شكرًا لاهتمامك بالمساهمة في CodeForge IDE! نرحب بجميع أنواع المساهمات.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Contribution Guidelines](#contribution-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Coding Standards](#coding-standards)
8. [Testing](#testing)
9. [Documentation](#documentation)
10. [Community](#community)

---

## 📜 Code of Conduct

نحن ملتزمون بتوفير بيئة ترحيبية وشاملة للجميع. يُتوقع من المساهمين:

- ✅ استخدام لغة ترحيبية وشاملة
- ✅ احترام وجهات النظر والتجارب المختلفة
- ✅ قبول النقد البناء بلطف
- ✅ التركيز على ما هو أفضل للمجتمع
- ✅ إظهار التعاطف مع أعضاء المجتمع الآخرين

❌ السلوك غير المقبول يشمل:
- التحرش بأي شكل من الأشكال
- التعليقات المهينة أو الاستفزازية
- الهجمات الشخصية أو السياسية
- التحرش العام أو الخاص
- نشر معلومات خاصة دون إذن

---

## 🚀 Getting Started

### Prerequisites

تأكد من تثبيت:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- محرر أكواد (نوصي بـ VS Code)

### Fork & Clone

1. **Fork المشروع** على GitHub
2. **استنسخ Fork الخاص بك**:

```bash
git clone https://github.com/YOUR_USERNAME/codeforge-ide.git
cd codeforge-ide
```

3. **أضف upstream remote**:

```bash
git remote add upstream https://github.com/bahoma31-jpg/codeforge-ide.git
```

---

## 💻 Development Setup

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

التطبيق سيعمل على `http://localhost:3000`

### Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm test             # Run tests
npm run test:watch   # Test watch mode
```

---

## 📁 Project Structure

```
codeforge-ide/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── codeforge/        # Main IDE components
│   │   ├── editor/       # Editor components
│   │   ├── sidebar/      # Sidebar components
│   │   ├── terminal/     # Terminal components
│   │   └── git/          # Git components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── git/              # Git service
│   ├── fs/               # File system service
│   └── stores/           # Zustand stores
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/                # Static assets
├── docs/                  # Documentation
└── tests/                 # Test files
```

---

## 🎯 Contribution Guidelines

### Types of Contributions

#### 1. Bug Reports

قبل إنشاء تقرير خطأ:
- ✅ تحقق من المشاكل الموجودة
- ✅ استخدم أحدث إصدار
- ✅ جرب إعادة إنتاج المشكلة

**استخدم هذا القالب**:

```markdown
## Bug Description
وصف واضح ومختصر للخطأ

## Steps to Reproduce
1. اذهب إلى '...'
2. اضغط على '...'
3. مرر إلى '...'
4. ستظهر المشكلة

## Expected Behavior
ماذا كنت تتوقع أن يحدث

## Actual Behavior
ماذا حدث فعليًا

## Screenshots
إن وجدت

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

## Additional Context
أي معلومات إضافية
```

#### 2. Feature Requests

```markdown
## Feature Description
وصف واضح للميزة المطلوبة

## Problem it Solves
ما المشكلة التي تحلها هذه الميزة؟

## Proposed Solution
كيف تقترح تنفيذ هذه الميزة؟

## Alternatives Considered
حلول بديلة تم النظر فيها

## Additional Context
أي معلومات إضافية
```

#### 3. Code Contributions

أنواع المساهمات المرحب بها:

- 🐛 إصلاح الأخطاء
- ✨ ميزات جديدة
- 📝 تحسين التوثيق
- 🎨 تحسينات UI/UX
- ⚡ تحسينات الأداء
- ♻️ إعادة البناء (Refactoring)
- ✅ إضافة اختبارات

---

## 🔄 Pull Request Process

### Before Submitting

1. **Create a branch**:
```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-fix
```

2. **Make your changes**

3. **Test your changes**:
```bash
npm run test
npm run lint
npm run type-check
```

4. **Commit your changes**:
```bash
git add .
git commit -m "feat: add amazing feature"
```

### Commit Message Format

نستخدم [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث التوثيق
- `style`: تنسيق الكود
- `refactor`: إعادة بناء الكود
- `test`: إضافة اختبارات
- `chore`: صيانة
- `perf`: تحسين الأداء

**أمثلة**:
```bash
feat: add dark mode support
feat(editor): add vim keybindings
fix: resolve terminal rendering bug
fix(git): handle merge conflicts correctly
docs: update README with new features
style: format code with prettier
refactor: simplify git service logic
test: add unit tests for file system
chore: update dependencies
perf: optimize editor rendering
```

### Submitting PR

1. **Push to your fork**:
```bash
git push origin feature/amazing-feature
```

2. **Create Pull Request** على GitHub

3. **Fill PR Template**:

```markdown
## Description
وصف التغييرات

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

### PR Review Process

1. **Automated Checks** - CI/CD سيختبر الكود
2. **Code Review** - مراجعة من المشرفين
3. **Changes Requested** - قد نطلب تعديلات
4. **Approval** - بعد الموافقة
5. **Merge** - سيتم الدمج

---

## 📏 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // no types
}
```

### React Components

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Hooks: `useCamelCase.ts`
- Types: `types.ts` or `interfaces.ts`

### Code Style

- استخدم 2 spaces للـ indentation
- استخدم single quotes للـ strings
- أضف semicolons
- استخدم arrow functions
- استخدم async/await بدلاً من promises chains

---

## 🧪 Testing

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📚 Documentation

### Code Comments

```typescript
/**
 * Commits staged changes to the repository
 * @param message - Commit message
 * @param options - Additional commit options
 * @returns Commit hash
 */
async function commit(
  message: string,
  options?: CommitOptions
): Promise<string> {
  // implementation
}
```

### README Updates

عند إضافة ميزة جديدة:
1. حدّث README.md
2. أضف أمثلة استخدام
3. حدّث قائمة الميزات

---

## 👥 Community

### Get Help

- 💬 [Discussions](https://github.com/bahoma31-jpg/codeforge-ide/discussions)
- 🐛 [Issues](https://github.com/bahoma31-jpg/codeforge-ide/issues)
- 📧 Email: support@codeforge.dev

### Stay Updated

- ⭐ Star المشروع
- 👁️ Watch للتحديثات
- 🔔 تابع Releases

---

## 🎉 Recognition

جميع المساهمين يتم ذكرهم في:

- README.md contributors section
- Release notes
- Contributors page

---

## 📝 License

بالمساهمة، توافق على ترخيص مساهماتك تحت نفس ترخيص المشروع [MIT License](./LICENSE).

---

**شكرًا لمساهمتك! 🙏**

نحن نقدر وقتك وجهدك في جعل CodeForge IDE أفضل.
