<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Hide, Iphone, Lock, Refresh, User, View } from '@element-plus/icons-vue'
import { tradeApi } from '../api/trade'
import type { AuthLoginResponse } from '../api/trade'
import AnimatedLoginCharacters from '../components/auth/AnimatedLoginCharacters.vue'
import { useAuthStore } from '../stores/auth'

type AuthMode = 'password' | 'sms' | 'register' | 'wechat'

const router = useRouter()
const auth = useAuthStore()
const mode = ref<AuthMode>('password')
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
const activeField = ref<'account' | 'password' | null>(null)
const showAccountPassword = ref(false)
const characterReaction = ref<'idle' | 'success' | 'error'>('idle')
let characterReactionTimer = 0
const account = ref({ username: '', password: '' })
const captcha = ref({ id: '', code: '', imageDataUrl: '' })
const captchaLoading = ref(false)
const sms = ref({ phone: '', code: '' })
const registration = ref({ tenantName: '', displayName: '', username: '', phone: '', code: '', password: '', confirmPassword: '' })
const phonePattern = /^(?:1[3-9]\d{9}|\+[1-9]\d{7,14})$/
const modeTitle = computed(() => ({
  password: ['欢迎回来', '使用企业账号继续处理客户协同工作'],
  sms: ['手机号登录', '验证码仅用于本次身份确认'],
  register: ['创建企业工作区', '先完成企业信息与管理员账号设置'],
  wechat: ['微信扫码登录', '使用已绑定企业账号的微信完成验证']
}[mode.value]))
const isAccountTyping = computed(() => mode.value === 'password' && activeField.value === 'account')
const isAccountPasswordActive = computed(() => mode.value === 'password' && activeField.value === 'password' && account.value.password.length > 0)

function triggerCharacterReaction(reaction: 'success' | 'error', duration = 760) {
  window.clearTimeout(characterReactionTimer)
  characterReaction.value = reaction
  characterReactionTimer = window.setTimeout(() => { characterReaction.value = 'idle' }, duration)
}

function warnUser(message: string) {
  triggerCharacterReaction('error')
  ElMessage.warning(message)
}

async function celebrateLogin() {
  triggerCharacterReaction('success', 620)
  await new Promise(resolve => window.setTimeout(resolve, 480))
}

async function finishLogin(data: AuthLoginResponse, fallback = '') {
  auth.applySession(data, fallback)
  await celebrateLogin()
  await router.push('/')
}

async function passwordLogin() {
  if (!account.value.username.trim() || !account.value.password) return warnUser('请输入登录账号和密码')
  if (!captcha.value.id || !/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/i.test(captcha.value.code.trim())) return warnUser('请输入图中的 5 位验证码')
  loading.value = true
  try {
    await auth.login(account.value.username, account.value.password, captcha.value.id, captcha.value.code)
    await celebrateLogin()
    await router.push('/')
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
    void refreshCaptcha()
  } finally {
    loading.value = false
  }
}

async function refreshCaptcha() {
  captchaLoading.value = true
  try {
    const response = await tradeApi.loginCaptcha()
    captcha.value = { id: response.captchaId, code: '', imageDataUrl: response.imageDataUrl }
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '人机验证加载失败')
  } finally {
    captchaLoading.value = false
  }
}

function beginCountdown(seconds: number) {
  countdown.value = seconds
  const timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

async function sendCode(purpose: 'LOGIN' | 'REGISTER') {
  const phone = purpose === 'LOGIN' ? sms.value.phone : registration.value.phone
  if (!phonePattern.test(phone.trim().replace(/[\s()-]/g, ''))) return warnUser('请输入有效的手机号码')
  if (sending.value || countdown.value > 0) return
  sending.value = true
  try {
    const response = await tradeApi.sendSmsCode(phone, purpose)
    beginCountdown(Math.min(response.expiresInSeconds, 60))
    triggerCharacterReaction('success')
    ElMessage.success('验证码已发送，请注意查收短信')
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '验证码发送失败')
  } finally {
    sending.value = false
  }
}

async function smsLogin() {
  if (!phonePattern.test(sms.value.phone.trim().replace(/[\s()-]/g, '')) || !/^\d{6}$/.test(sms.value.code)) return warnUser('请输入有效手机号和 6 位验证码')
  loading.value = true
  try {
    await finishLogin(await tradeApi.smsLogin(sms.value.phone, sms.value.code), sms.value.phone)
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

async function register() {
  const form = registration.value
  if (!form.tenantName.trim() || !form.displayName.trim() || !form.username.trim() || !form.phone.trim() || !form.code || !form.password) {
    return warnUser('请完整填写企业注册信息')
  }
  if (form.password !== form.confirmPassword) return warnUser('两次输入的密码不一致')
  if (!phonePattern.test(form.phone.trim().replace(/[\s()-]/g, ''))) return warnUser('请输入有效的手机号码')
  if (!/^[A-Za-z][A-Za-z0-9_]{3,63}$/.test(form.username)) return warnUser('登录账号格式不正确')
  if (form.password.length < 10 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return warnUser('密码至少 10 位，且需包含字母和数字')
  loading.value = true
  try {
    const result = await tradeApi.register({
      tenantName: form.tenantName, displayName: form.displayName, username: form.username,
      phone: form.phone, verificationCode: form.code, password: form.password
    })
    ElMessage.success(`企业工作区已创建，请使用 ${result.username} 登录`)
    triggerCharacterReaction('success')
    account.value.username = result.username
    account.value.password = ''
    mode.value = 'password'
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '注册失败')
  } finally {
    loading.value = false
  }
}

async function startWechatLogin() {
  loading.value = true
  try {
    const { authorizationUrl } = await tradeApi.wechatAuthorization()
    window.location.assign(authorizationUrl)
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '微信扫码暂不可用')
  } finally {
    loading.value = false
  }
}

async function finishWechatCallback() {
  const ticket = new URLSearchParams(window.location.search).get('wechatLoginTicket')
  if (!ticket) return
  loading.value = true
  try {
    await finishLogin(await tradeApi.wechatTicketLogin(ticket))
    window.history.replaceState({}, document.title, '/login')
  } catch (error) {
    triggerCharacterReaction('error')
    ElMessage.error(error instanceof Error ? error.message : '微信登录失败，请重新扫码')
    window.history.replaceState({}, document.title, '/login')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refreshCaptcha()
  void finishWechatCallback()
})

onBeforeUnmount(() => window.clearTimeout(characterReactionTimer))
</script>

<template>
  <main class="login-shell enterprise-auth-shell">
    <section class="login-visual">
      <div class="login-backdrop" aria-hidden="true"></div>
      <header class="login-brand"><span>NX</span><div><strong>NexaFlow</strong><small>客户协同工作台</small></div></header>
    </section>
    <section class="login-auth-area">
      <section class="login-panel enterprise-auth-panel">
        <div class="login-panel-head"><span>企业身份中心</span><h2>{{ modeTitle[0] }}</h2><p>{{ modeTitle[1] }}</p></div>
        <AnimatedLoginCharacters
          :mode="mode"
          :is-typing="isAccountTyping"
          :is-password-active="isAccountPasswordActive"
          :is-password-visible="showAccountPassword"
          :is-loading="loading || sending || captchaLoading"
          :reaction="characterReaction"
        />
        <el-tabs v-model="mode" class="auth-tabs" stretch>
        <el-tab-pane label="账号登录" name="password">
          <form class="auth-form" @submit.prevent="passwordLogin">
            <label class="login-field"><span>登录账号</span><el-input v-model="account.username" :prefix-icon="User" placeholder="请输入登录账号" autocomplete="username" @focus="activeField = 'account'" @blur="activeField = null" /></label>
            <label class="login-field"><span>登录密码</span><el-input v-model="account.password" :prefix-icon="Lock" placeholder="请输入登录密码" :type="showAccountPassword ? 'text' : 'password'" autocomplete="current-password" @focus="activeField = 'password'" @blur="activeField = null"><template #suffix><button class="password-visibility" type="button" :aria-label="showAccountPassword ? '隐藏密码' : '显示密码'" :title="showAccountPassword ? '隐藏密码' : '显示密码'" @mousedown.prevent @click="showAccountPassword = !showAccountPassword"><el-icon><Hide v-if="showAccountPassword" /><View v-else /></el-icon></button></template></el-input></label>
            <label class="login-field"><span>人机验证</span><div class="login-captcha"><el-input v-model="captcha.code" maxlength="5" placeholder="请输入图中字符" autocomplete="off" /><button class="login-captcha-image" type="button" :disabled="captchaLoading" title="点击刷新验证码" @click="refreshCaptcha"><img v-if="captcha.imageDataUrl" :src="captcha.imageDataUrl" alt="登录验证码，点击刷新" /><span v-else>加载中</span></button><el-button class="login-captcha-refresh" native-type="button" :icon="Refresh" circle title="刷新验证码" aria-label="刷新验证码" :loading="captchaLoading" @click="refreshCaptcha" /></div></label>
            <el-button native-type="submit" type="primary" :loading="loading">进入工作台</el-button>
          </form>
        </el-tab-pane>
        <el-tab-pane label="手机登录" name="sms">
          <form class="auth-form" @submit.prevent="smsLogin">
            <label class="login-field"><span>手机号码</span><el-input v-model="sms.phone" :prefix-icon="Iphone" placeholder="请输入已绑定的手机号码" autocomplete="tel" /></label>
            <label class="login-field"><span>验证码</span><el-input v-model="sms.code" :prefix-icon="Lock" maxlength="6" placeholder="请输入 6 位验证码" autocomplete="one-time-code"><template #append><el-button :disabled="countdown > 0" :loading="sending" @click="sendCode('LOGIN')">{{ countdown ? `${countdown} 秒后重发` : '获取验证码' }}</el-button></template></el-input></label>
            <el-button native-type="submit" type="primary" :loading="loading">验证并登录</el-button>
          </form>
        </el-tab-pane>
        <el-tab-pane label="创建企业" name="register">
          <form class="auth-form register-form" @submit.prevent="register">
            <div class="auth-two-columns"><label class="login-field"><span>企业名称</span><el-input v-model="registration.tenantName" placeholder="例如：NexaFlow 客户团队" /></label><label class="login-field"><span>管理员姓名</span><el-input v-model="registration.displayName" placeholder="请输入姓名" /></label></div>
            <div class="auth-two-columns"><label class="login-field"><span>登录账号</span><el-input v-model="registration.username" placeholder="4-64 位字母、数字或下划线" autocomplete="username" /></label><label class="login-field"><span>手机号码</span><el-input v-model="registration.phone" placeholder="用于身份验证" autocomplete="tel" /></label></div>
            <label class="login-field"><span>短信验证码</span><el-input v-model="registration.code" :prefix-icon="Lock" maxlength="6" placeholder="请输入 6 位验证码"><template #append><el-button :disabled="countdown > 0" :loading="sending" @click="sendCode('REGISTER')">{{ countdown ? `${countdown} 秒后重发` : '获取验证码' }}</el-button></template></el-input></label>
            <div class="auth-two-columns"><label class="login-field"><span>设置密码</span><el-input v-model="registration.password" type="password" show-password placeholder="至少 10 位，含字母和数字" autocomplete="new-password" /></label><label class="login-field"><span>确认密码</span><el-input v-model="registration.confirmPassword" type="password" show-password placeholder="再次输入密码" autocomplete="new-password" /></label></div>
            <el-button native-type="submit" type="primary" :loading="loading">创建企业工作区</el-button>
          </form>
        </el-tab-pane>
        <el-tab-pane label="微信扫码" name="wechat">
          <div class="wechat-auth">
            <div class="wechat-mark"><span>微</span><i></i><i></i><i></i></div>
            <strong>使用微信完成身份验证</strong><p>仅支持已由企业管理员完成绑定的微信账号。</p>
            <el-button type="primary" :loading="loading" @click="startWechatLogin">打开微信扫码页</el-button>
          </div>
        </el-tab-pane>
        </el-tabs>
        <p class="login-security"><el-icon><Lock /></el-icon>登录受权限、风控与操作审计保护</p>
      </section>
      <footer class="login-footer"><span>NexaFlow Enterprise</span><span>安全 · 专业 · 可追溯</span></footer>
    </section>
  </main>
</template>
