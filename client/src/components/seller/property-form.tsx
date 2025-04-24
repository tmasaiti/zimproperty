import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UploadCloud } from 'lucide-react';

// Define schema for property form
const propertyFormSchema = z.object({
  type: z.enum(['residential', 'commercial', 'land', 'apartment'], {
    required_error: 'Please select a property type',
  }),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(5, 'Please enter a valid address'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  size: z.coerce.number().positive('Size must be greater than 0').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  photos: z.array(z.string()).optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  onSubmit: (data: PropertyFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit, onCancel, isPending }) => {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      type: 'residential',
      location: '',
      address: '',
      price: undefined,
      size: undefined,
      description: '',
      photos: [],
    },
  });

  // Mock file upload functionality
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate file upload delay
    setTimeout(() => {
      const fileNames = Array.from(e.target.files || []).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      form.setValue('photos', [...uploadedFiles, ...fileNames]);
      setIsUploading(false);
    }, 1000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land/Plot</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location/Area*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="harare">Harare</SelectItem>
                    <SelectItem value="bulawayo">Bulawayo</SelectItem>
                    <SelectItem value="chitungwiza">Chitungwiza</SelectItem>
                    <SelectItem value="mutare">Mutare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address*</FormLabel>
              <FormControl>
                <Input placeholder="Enter the full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)*</FormLabel>
                <FormControl>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-7" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size (sqm)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Property size in square meters" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      field.onChange(isNaN(value) ? undefined : value);
                    }}
                  />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Description*</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your property" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Property Photos (Max 5 photos, 5MB each)*</FormLabel>
              <FormControl>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                </div>
              </FormControl>
              {isUploading && (
                <div className="mt-2 flex items-center text-sm text-blue-600">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Uploading...
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Uploaded files:</p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-1">✓</span> {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Preferences</h3>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox id="whatsappPreference" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="whatsappPreference" className="font-medium text-gray-700">
                I prefer to be contacted via WhatsApp
              </label>
            </div>
          </div>
        </div>

        <div className="pt-5 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary-700" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Property
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PropertyForm;
