import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="logo">L</div>
          <div class="brand-text">LungCare AI</div>
        </div>
        <nav class="main-nav">
          <a routerLink="/patient/dashboard" class="nav-item">Dashboard</a>
          <a routerLink="/patient/dashboard" class="nav-item">My Reports</a>
          <a routerLink="/settings" class="nav-item active">Settings</a>
        </nav>
        <div class="profile-area">
          <div class="user-name">{{ user?.firstName }} {{ user?.lastName }}<div class="user-role">{{ user?.role }}</div></div>
          <button class="link-logout" (click)="logout()">Logout</button>
        </div>
      </div>
    </header>

    <section class="page">
      <div class="page-inner">
        <h2>Settings</h2>
        <p class="muted">Manage your account preferences and security</p>

        <div class="settings-grid">
          <aside class="sidebar">
            <ul>
              <li [class.active]="tab==='profile'" (click)="tab='profile'">Profile</li>
              <li [class.active]="tab==='security'" (click)="tab='security'">Security</li>
              <li [class.active]="tab==='notifications'" (click)="tab='notifications'">Notifications</li>
              <li [class.active]="tab==='privacy'" (click)="tab='privacy'">Privacy</li>
            </ul>
          </aside>

          <div class="panel">
            <ng-container *ngIf="tab==='profile'">
              <h3>Profile Settings</h3>
              <form (ngSubmit)="save()">
                <div class="row">
                  <label>Full Name
                    <input [(ngModel)]="form.fullName" name="fullName" placeholder="Full name" />
                  </label>
                  <label>Email Address
                    <input [(ngModel)]="form.email" name="email" placeholder="Email" />
                  </label>
                </div>

                <div class="row">
                  <label>Phone Number
                    <input [(ngModel)]="form.phone" name="phone" placeholder="Phone number" />
                  </label>
                  <label>Address
                    <input [(ngModel)]="form.address" name="address" placeholder="Address" />
                  </label>
                </div>

                <div class="actions">
                  <button class="btn-primary" type="submit">Save Changes</button>
                  <span class="status" *ngIf="status">{{ status }}</span>
                </div>
              </form>
            </ng-container>

            <ng-container *ngIf="tab==='security'">
              <h3>Security Settings</h3>
              <form (ngSubmit)="changePassword()">
                <div class="row">
                  <label>Current Password
                    <input type="password" [(ngModel)]="pw.current" name="current" placeholder="Enter current password" />
                  </label>
                </div>
                <div class="row">
                  <label>New Password
                    <input type="password" [(ngModel)]="pw.new" name="new" placeholder="Enter new password" />
                  </label>
                  <label>Confirm New Password
                    <input type="password" [(ngModel)]="pw.confirm" name="confirm" placeholder="Confirm new password" />
                  </label>
                </div>

                <div class="help-box">
                  <strong>Password Requirements</strong>
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>

                <div class="actions">
                  <button class="btn-primary" type="submit">Change Password</button>
                  <span class="status" *ngIf="pwStatus">{{ pwStatus }}</span>
                </div>
              </form>

              <hr />
              <h4>Two-Factor Authentication</h4>
              <div class="twofa">
                <div class="twofa-desc">Enable 2FA - Add an extra layer of security to your account</div>
                <button class="btn-secondary" (click)="enable2FA()">Enable</button>
              </div>
            </ng-container>

            <ng-container *ngIf="tab==='notifications'">
              <h3>Notifications</h3>
              <p class="muted">Notification preferences will go here.</p>
            </ng-container>

            <ng-container *ngIf="tab==='privacy'">
              <h3>Privacy</h3>
              <div class="help-box">
                <strong>Data Management</strong>
                <div style="margin-top:8px;display:flex;flex-direction:column;gap:12px">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:8px;background:#fff">
                    <div>
                      <div style="font-weight:600">Download My Data</div>
                      <div class="muted">Export all your data in a portable format</div>
                    </div>
                    <button class="btn-secondary" (click)="downloadData()">Download</button>
                  </div>

                  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:8px;background:#fff;border:1px solid #fee2e2">
                    <div>
                      <div style="font-weight:600;color:#b91c1c">Delete Account</div>
                      <div class="muted">Permanently delete your account and all data</div>
                    </div>
                    <button class="btn-secondary" style="background:#fff;border:1px solid #fca5a5;color:#b91c1c" (click)="openDeleteModal()">Delete</button>
                  </div>
                </div>
              </div>

              <h4 style="margin-top:18px">Legal Documents</h4>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
                <div style="padding:12px;border-radius:8px;background:#fff">Privacy Policy</div>
                <div style="padding:12px;border-radius:8px;background:#fff">Terms of Service</div>
                <div style="padding:12px;border-radius:8px;background:#fff">HIPAA Compliance</div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </section>
    <!-- Delete Account Modal -->
    <div *ngIf="showDeleteModal" class="modal-backdrop">
      <div class="modal">
        <h3>Confirm Account Deletion</h3>
        <p class="muted">This action is irreversible. Enter your current password to permanently delete your account.</p>
        <div class="row">
          <label>Current Password
            <input type="password" [(ngModel)]="deletePassword" name="deletePassword" placeholder="Enter current password" />
          </label>
        </div>
        <div *ngIf="deleteError" style="color:#b91c1c;margin-top:6px">{{ deleteError }}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
          <button class="btn-secondary" (click)="closeDeleteModal()" [disabled]="deleteLoading">Cancel</button>
          <button class="btn-primary" (click)="confirmDelete()" [disabled]="deleteLoading">{{ deleteLoading ? 'Deleting...' : 'Delete Account' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;font-family:Inter,Arial,Helvetica,sans-serif;color:#0b1b2b}
    .topbar { background: #fff; border-bottom: 1px solid #eef2f6; }
    .topbar-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:14px 20px; }
    .brand { display:flex; align-items:center; gap:12px; }
    .logo { width:40px; height:40px; border-radius:8px; background:linear-gradient(135deg,#1dd3b0,#2b8cff); color:white; display:flex; align-items:center; justify-content:center; font-weight:700 }
    .brand-text { font-weight:600; color:#0b1b2b }
    .main-nav { display:flex; gap:18px; align-items:center }
    .nav-item { color:#54607a; text-decoration:none; padding:8px 12px; border-radius:8px }
    .nav-item.active { background:#e6fbf5; color:#0aa678; font-weight:600 }
    .profile-area { display:flex; align-items:center; gap:12px }
    .user-name { text-align:right; font-size:14px; color:#0b1b2b }
    .user-role { font-size:12px; color:#7b8794 }
    .link-logout { background:none; border:none; color:#6b7280; cursor:pointer }

    
    .page-inner{max-width:1200px;margin:24px auto;padding:0 20px}
    h2{margin:0 0 6px}
    .muted{color:#6b7280;margin-bottom:18px}
    .settings-grid{display:flex;gap:28px}
    .sidebar{width:220px}
    .sidebar ul{list-style:none;padding:12px;background:#fff;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.06)}
    .sidebar li{padding:14px 16px;color:#0b1b2b;border-radius:8px}
    .sidebar li.active{background:#f0fdf6;color:#065f46}
    .panel{flex:1;background:#fff;padding:22px;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.06)}
    .row{display:flex;gap:16px;margin-bottom:12px}
    label{display:flex;flex-direction:column;flex:1;font-size:13px;color:#334155}
    input{margin-top:8px;padding:12px;border-radius:8px;border:1px solid #e6eef6}
    .actions{display:flex;align-items:center;gap:12px;margin-top:16px}
    .btn-primary{background:#10b981;color:#fff;padding:10px 16px;border-radius:8px;border:none;cursor:pointer}
    .status{color:#065f46}
    .help-box{background:#eff8ff;border-radius:8px;padding:12px;margin-top:12px}
    .help-box ul{margin:8px 0 0 18px}
    .twofa{display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:8px;background:#f8fafc;margin-top:12px}
    .btn-secondary{background:#fff;border:1px solid #e6eef6;padding:8px 12px;border-radius:8px;cursor:pointer}
    .sidebar ul{list-style:none;padding:12px;background:#fff;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.06)}
    .sidebar li{padding:14px 16px;color:#0b1b2b;border-radius:8px;cursor:pointer}
    .sidebar li.active{background:#f0fdf6;color:#065f46}
    /* Modal styles */
    .modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,0.45);display:flex;align-items:center;justify-content:center;z-index:1200}
    .modal{background:#fff;padding:18px;border-radius:10px;max-width:520px;width:100%;box-shadow:0 12px 48px rgba(2,6,23,0.24)}
    .modal h3{margin:0 0 6px}
    .modal .muted{margin:0 0 12px}
  `]
})
export class SettingsComponent {
  user: any = null;
  form: any = { fullName: '', email: '', phone: '', address: '' };
  status = '';
  tab: 'profile' | 'security' | 'notifications' | 'privacy' = 'profile';
  pw: any = { current: '', new: '', confirm: '' };
  pwStatus = '';
  twoFaPending = false;
  twoFaCode = '';
  twoFaMessage = '';

  constructor(private auth: AuthService) {
    this.load();
  }

  logout(): void {
    this.auth.logout();
  }

  changePassword(): void {
    if (!this.pw.current || !this.pw.new || !this.pw.confirm) {
      this.pwStatus = 'Please fill all password fields';
      return;
    }
    if (this.pw.new !== this.pw.confirm) {
      this.pwStatus = 'New passwords do not match';
      return;
    }
    // Basic client-side validation
    if (this.pw.new.length < 8) {
      this.pwStatus = 'Password must be at least 8 characters';
      return;
    }
    this.pwStatus = 'Changing...';
    this.auth.changePassword(this.pw.current, this.pw.new).subscribe({ next: (res:any) => {
      this.pwStatus = res.message || 'Password changed';
      this.pw = { current: '', new: '', confirm: '' };
      setTimeout(()=> this.pwStatus = '', 2500);
    }, error: (err:any) => {
      this.pwStatus = err.error?.message || 'Change failed';
    }});
  }

  enable2FA(): void {
    // Placeholder UI action for enabling 2FA — implement backend flow later
    this.pwStatus = '2FA enable flow is not implemented yet';
    setTimeout(()=> this.pwStatus = '', 2500);
  }

  downloadData(): void {
    this.status = 'Preparing download...';
    this.auth.exportProfileData().subscribe({ next: (res:any) => {
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onco_stage_data_${this.user?.id || 'me'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      this.status = 'Download started';
      setTimeout(()=> this.status = '', 2500);
    }, error: (err:any) => {
      this.status = err.error?.message || 'Failed to prepare data export';
    }});
  }

  // Custom modal-based delete flow
  showDeleteModal = false;
  deletePassword = '';
  deleteError = '';
  deleteLoading = false;

  openDeleteModal(): void {
    this.deletePassword = '';
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletePassword = '';
    this.deleteError = '';
    this.deleteLoading = false;
  }

  confirmDelete(): void {
    if (!this.deletePassword) {
      this.deleteError = 'Please enter your current password';
      return;
    }
    this.deleteLoading = true;
    this.deleteError = '';
    this.auth.deleteAccount(this.deletePassword).subscribe({ next: (res:any) => {
      this.deleteLoading = false;
      this.showDeleteModal = false;
      alert(res.message || 'Account deleted');
      this.auth.logout();
    }, error: (err:any) => {
      this.deleteLoading = false;
      this.deleteError = err.error?.message || 'Failed to delete account';
    }});
  }

  load(): void {
    this.auth.getProfile().subscribe({ next: (res:any) => {
        this.user = res.user;
        this.form.fullName = `${this.user.firstName} ${this.user.lastName}`;
        this.form.email = this.user.email;
      }, error: () => {
        this.status = 'Failed to load profile';
      }
    });
  }

  save(): void {
    const [firstName, ...rest] = (this.form.fullName || '').split(' ');
    const lastName = rest.join(' ');
    this.status = 'Saving...';
    this.auth.updateProfile({ firstName, lastName, email: this.form.email }).subscribe({ next: (res:any) => {
        this.status = 'Saved';
        setTimeout(()=> this.status = '', 2500);
      }, error: (err:any) => {
        this.status = err.error?.message || 'Save failed';
      }
    });
  }
}
