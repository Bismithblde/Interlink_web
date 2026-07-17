import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Camera, Check, RotateCcw, X } from "lucide-react";
import { authApi, AuthApiError } from "../services/authApi";
import type {
  ProfileEnrichmentStatus,
  ProfileIntent,
  SupabaseUser,
} from "../types/user";

type ProfileEditorFormProps = {
  accessToken: string | null;
  user: SupabaseUser | null;
  onUserUpdated: (user: SupabaseUser) => void;
  onSaved: () => void;
};

type AvatarState = {
  blob: Blob;
  previewUrl: string;
  name: string;
};

const INTENT_OPTIONS: Array<{ value: ProfileIntent; label: string }> = [
  { value: "new-friends", label: "New friends" },
  { value: "study-buddy", label: "Study partners" },
  { value: "project-partner", label: "Project collaborators" },
  { value: "casual-hangout", label: "Campus activities" },
];

const toInputList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((entry) => `${entry}`.trim()).filter(Boolean).join(", ");
  }
  return typeof value === "string" ? value : "";
};

const toList = (value: string) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const normalizeInstagram = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .replace(/\s+/g, "");

const loadImage = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const image = new Image();
  const source = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("We could not read that image."));
      image.src = source;
    });
    return image;
  } finally {
    URL.revokeObjectURL(source);
  }
};

const prepareAvatar = async (file: File): Promise<AvatarState> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 12 MB.");
  }

  const image = await loadImage(file);
  const width = image.width;
  const height = image.height;
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");

  context.drawImage(
    image,
    (width - side) / 2,
    (height - side) / 2,
    side,
    side,
    0,
    0,
    512,
    512
  );
  if ("close" in image && typeof image.close === "function") image.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Your browser could not prepare this image.")),
      "image/webp",
      0.86
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    name: file.name,
  };
};

const uploadBlob = (
  descriptor: Awaited<ReturnType<typeof authApi.createAvatarUpload>>,
  blob: Blob,
  onProgress: (progress: number) => void
) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(descriptor.method ?? "PUT", descriptor.uploadUrl);
    Object.entries(descriptor.headers ?? {}).forEach(([name, value]) =>
      request.setRequestHeader(name, value)
    );
    if (!descriptor.headers?.["Content-Type"]) {
      request.setRequestHeader("Content-Type", blob.type);
    }
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onerror = () => reject(new Error("The photo upload was interrupted."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("The photo could not be uploaded. Please retry."));
      }
    };
    request.send(blob);
  });

const ProfileEditorForm = ({
  accessToken,
  user,
  onUserUpdated,
  onSaved,
}: ProfileEditorFormProps) => {
  const metadata =
    (user as { user_metadata?: Record<string, unknown> } | null)?.user_metadata ?? {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(
    typeof metadata.bio === "string" ? metadata.bio : ""
  );
  const [major, setMajor] = useState(
    typeof metadata.major === "string" ? metadata.major : ""
  );
  const [classes, setClasses] = useState(toInputList(metadata.classes));
  const [interests, setInterests] = useState(toInputList(metadata.interests));
  const [hobbies, setHobbies] = useState(toInputList(metadata.hobbies));
  const [favoriteSpot, setFavoriteSpot] = useState(
    typeof metadata.favoriteSpot === "string" ? metadata.favoriteSpot : ""
  );
  const [age, setAge] = useState(
    typeof metadata.age === "number" ? `${metadata.age}` : ""
  );
  const [instagram, setInstagram] = useState(
    typeof metadata.instagram === "string" ? metadata.instagram : ""
  );
  const [openTo, setOpenTo] = useState<ProfileIntent[]>(
    Array.isArray(metadata.openTo)
      ? metadata.openTo.filter((value): value is ProfileIntent =>
          INTENT_OPTIONS.some((option) => option.value === value)
        )
      : []
  );
  const [avatar, setAvatar] = useState<AvatarState | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(
    typeof metadata.avatarUrl === "string" ? metadata.avatarUrl : ""
  );
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrichment, setEnrichment] = useState<ProfileEnrichmentStatus | null>(null);
  const [feedbackTagId, setFeedbackTagId] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (avatar?.previewUrl) URL.revokeObjectURL(avatar.previewUrl);
    },
    [avatar]
  );

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    authApi
      .getEnrichmentStatus(accessToken)
      .then((result) => {
        if (!cancelled) setEnrichment(result);
      })
      .catch((error) => {
        if (!(error instanceof AuthApiError && error.status === 404)) {
          console.warn("[ProfileEditor] Could not load recommendation status", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarError(null);
    setIsPreparingAvatar(true);
    try {
      const prepared = await prepareAvatar(file);
      setAvatar((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return prepared;
      });
      setUploadProgress(0);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Choose another image.");
    } finally {
      setIsPreparingAvatar(false);
    }
  };

  const handleAvatarUpload = async (): Promise<string | null> => {
    if (!avatar || !accessToken) {
      setAvatarError("Sign in again before uploading your photo.");
      return null;
    }
    setAvatarError(null);
    setIsUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const descriptor = await authApi.createAvatarUpload(accessToken, {
        contentType: avatar.blob.type,
        fileSize: avatar.blob.size,
      });
      await uploadBlob(descriptor, avatar.blob, setUploadProgress);
      setAvatarUrl(descriptor.avatarUrl);
      setAvatar(null);
      return descriptor.avatarUrl;
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "The photo could not be uploaded."
      );
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleIntent = (intent: ProfileIntent) => {
    setOpenTo((current) =>
      current.includes(intent)
        ? current.filter((value) => value !== intent)
        : [...current, intent]
    );
  };

  const handleFeedback = async (tagId: string, action: "confirm" | "dismiss") => {
    if (!accessToken) return;
    setFeedbackTagId(tagId);
    try {
      const result = await authApi.updateTagFeedback(accessToken, tagId, action);
      setEnrichment(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not save that preference."
      );
    } finally {
      setFeedbackTagId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedBio = bio.trim();
    if (trimmedBio.length < 40 || trimmedBio.length > 800) {
      setErrorMessage("Write a bio between 40 and 800 characters.");
      return;
    }
    if (openTo.length === 0) {
      setErrorMessage("Choose at least one kind of connection you are open to.");
      return;
    }
    if (!accessToken) {
      setErrorMessage("Your session has expired. Log in again to save your profile.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const savedAvatarUrl = avatar ? await handleAvatarUpload() : avatarUrl;
      if (avatar && !savedAvatarUrl) {
        throw new Error("Your profile photo could not be uploaded. Retry or remove it before saving.");
      }
      const numericAge = Number(age);
      const response = await authApi.updateProfile(accessToken, {
        profileComplete: true,
        bio: trimmedBio,
        major: major.trim() || null,
        classes: toList(classes),
        interests: toList(interests),
        hobbies: toList(hobbies),
        favoriteSpot: favoriteSpot.trim() || null,
        openTo,
        avatarUrl: savedAvatarUrl || null,
        instagram: normalizeInstagram(instagram) || null,
        ...(age.trim() && Number.isFinite(numericAge) ? { age: numericAge } : {}),
      });
      if (response.user) onUserUpdated(response.user);
      setEnrichment((current) => ({
        status: "queued",
        tags: current?.tags ?? [],
        message: "Your recommendations are being refreshed.",
      }));
      onSaved();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We could not save your profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const bioCountInvalid = bio.length > 0 && (bio.trim().length < 40 || bio.length > 800);
  const displayedAvatar = avatar?.previewUrl || avatarUrl;

  return (
    <form className="signup-form profile-editor" onSubmit={handleSubmit} noValidate>
      <div className="signup-tabs" aria-label="Signup progress">
        <div className="signup-tabs__step is-complete">
          <Check aria-hidden="true" /> Account
        </div>
        <div className="signup-tabs__step is-active" aria-current="step">
          Profile
        </div>
      </div>

      <div className="profile-editor__lead">
        <div className="profile-avatar">
          <div className="profile-avatar__preview">
            {displayedAvatar ? (
              <img src={displayedAvatar} alt="Your selected profile" />
            ) : (
              <Camera aria-hidden="true" />
            )}
          </div>
          <div className="profile-avatar__actions">
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              aria-label="Choose a profile photo"
            />
            <button
              type="button"
              className="profile-secondary-action"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreparingAvatar || isUploadingAvatar}
            >
              {isPreparingAvatar ? "Preparing..." : displayedAvatar ? "Choose another" : "Choose photo"}
            </button>
            {avatar && avatarUrl !== displayedAvatar ? (
              <button
                type="button"
                className="profile-secondary-action"
                onClick={handleAvatarUpload}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? `Uploading ${uploadProgress}%` : avatarError ? "Retry upload" : "Upload photo"}
              </button>
            ) : null}
            {displayedAvatar ? (
              <button
                type="button"
                className="profile-text-action"
                onClick={() => {
                  setAvatar(null);
                  setAvatarUrl("");
                  setAvatarError(null);
                  setUploadProgress(0);
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
          <p>Square photos work best. We crop and resize them before upload.</p>
          {avatarError ? <p className="profile-field-error" role="alert">{avatarError}</p> : null}
        </div>

        <label className="profile-field profile-field--bio" htmlFor="bio">
          <span>Bio <strong>Required</strong></span>
          <textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What are you curious about, and what kind of people would you like to meet on campus?"
            minLength={40}
            maxLength={800}
            required
            aria-describedby="bio-help"
            aria-invalid={bioCountInvalid}
          />
          <span id="bio-help" className={bioCountInvalid ? "is-invalid" : ""}>
            <span>Be specific so we can introduce you thoughtfully.</span>
            <span>{bio.length}/800</span>
          </span>
        </label>
      </div>

      <div className="profile-editor__grid">
        <label className="profile-field" htmlFor="major">
          <span>Major</span>
          <input id="major" value={major} onChange={(event) => setMajor(event.target.value)} placeholder="Computer Science" />
        </label>
        <label className="profile-field" htmlFor="classes">
          <span>Classes</span>
          <input id="classes" value={classes} onChange={(event) => setClasses(event.target.value)} placeholder="CS 311, MATH 241" />
          <small>Separate classes with commas.</small>
        </label>
        <label className="profile-field" htmlFor="interests">
          <span>Interests</span>
          <input id="interests" value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="robotics, film photography, startups" />
          <small>Separate interests with commas.</small>
        </label>
        <label className="profile-field" htmlFor="hobbies">
          <span>Hobbies</span>
          <input id="hobbies" value={hobbies} onChange={(event) => setHobbies(event.target.value)} placeholder="climbing, cooking, intramural soccer" />
          <small>Separate hobbies with commas.</small>
        </label>
        <label className="profile-field" htmlFor="favoriteSpot">
          <span>Favorite campus spot</span>
          <input id="favoriteSpot" value={favoriteSpot} onChange={(event) => setFavoriteSpot(event.target.value)} placeholder="The greenhouse reading room" />
        </label>
        <label className="profile-field" htmlFor="instagram">
          <span>Instagram <small>Optional</small></span>
          <input id="instagram" value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@yourhandle" autoComplete="off" />
        </label>
        <label className="profile-field" htmlFor="age">
          <span>Age <small>Optional</small></span>
          <input id="age" type="number" min="13" max="120" value={age} onChange={(event) => setAge(event.target.value)} placeholder="20" inputMode="numeric" />
        </label>
      </div>

      <fieldset className="profile-intents">
        <legend>What are you open to?</legend>
        <p>Choose every type of introduction that feels useful.</p>
        <div>
          {INTENT_OPTIONS.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={openTo.includes(option.value)}
                onChange={() => toggleIntent(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {enrichment ? (
        <section className="profile-signals" aria-labelledby="profile-signals-title">
          <div>
            <h2 id="profile-signals-title">Your recommendation signals</h2>
            <p>
              {enrichment.status === "ready"
                ? "Tell us which details feel accurate."
                : enrichment.status === "failed"
                  ? "We will retry your recommendation update shortly."
                  : "We are refreshing who we introduce you to."}
            </p>
          </div>
          {enrichment.tags.length > 0 ? (
            <ul>
              {enrichment.tags.filter((tag) => tag.status !== "dismissed").map((tag) => (
                <li key={tag.id}>
                  <span>{tag.label}</span>
                  {tag.status === "suggested" || !tag.status ? (
                    <span className="profile-signals__actions">
                      <button type="button" onClick={() => handleFeedback(tag.id, "confirm")} disabled={feedbackTagId === tag.id} aria-label={`Keep ${tag.label}`}><Check aria-hidden="true" /></button>
                      <button type="button" onClick={() => handleFeedback(tag.id, "dismiss")} disabled={feedbackTagId === tag.id} aria-label={`Remove ${tag.label}`}><X aria-hidden="true" /></button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {errorMessage ? <p className="signup-form__error" role="alert">{errorMessage}</p> : null}

      <div className="profile-editor__footer">
        <p>Your profile details are used to improve your introductions.</p>
        <button className="signup-submit" type="submit" disabled={isSubmitting || isUploadingAvatar}>
          {isSubmitting ? "Saving profile..." : "Save profile"}
          {errorMessage ? <RotateCcw aria-hidden="true" /> : <Check aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditorForm;
